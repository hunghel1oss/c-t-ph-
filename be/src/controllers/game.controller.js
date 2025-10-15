const Game = require('../models/game.model');
const mongoose = require('mongoose');
const PlayerState = require('../models/playerState.model');
const SquareState = require('../models/squareState.model');
const Card = require('../models/card.model');
const SquareTemplate = require('../models/SquareTemplate.model');
// ✅ FIX: Import hàm startGame từ file mới (để tránh circular dependency)
const { startGame } = require('./game.start.controller');
// ✅ FIX: Import hàm shuffleArray từ file gameHelper.js mới
// Hàm này chỉ được import để đảm bảo không có lỗi tham chiếu ở các hàm khác (nếu có)
const { shuffleArray } = require('../utils/gameHelper');


// ================= HELPER FUNCTIONS =================

const generateRoomCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let gameCode = '';
    let isUnique = false;

    while (!isUnique) {
        gameCode = '';
        for (let i = 0; i < 6; i++) {
            gameCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        const existingGame = await Game.findOne({ roomCode: gameCode });
        if (!existingGame) {
            isUnique = true;
        }
    }
    return gameCode;
};

// Lưu ý: shuffleArray đã được định nghĩa và export từ be/src/utils/gameHelper.js

// ================= GAME MANAGEMENT =================

// ✅ CREATE GAME (HOST) - Logic tạo game ban đầu
exports.createGame = async (req, res) => {
    const userId = req.user.id;
    const { duration } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log('📡 [API] Create game request:', { userId, duration });

        // Clean up old PlayerStates first, then Games
        const oldPlayerStates = await PlayerState.find({ userId }).session(session);
        const oldGameIds = oldPlayerStates.map(ps => ps.gameId).filter(Boolean);
        
        await PlayerState.deleteMany({ userId }, { session });
        await Game.deleteMany({ _id: { $in: oldGameIds } }, { session });
        await SquareState.deleteMany({ owner: userId }, { session });
        await Card.deleteMany({ owner: userId }, { session });

        const roomCode = await generateRoomCode();
        console.log('🎲 [API] Generated room code:', roomCode);

        const playerState = new PlayerState({ userId, money: 8000, position: 0, pet: null, ready: false });
        
        const newGame = new Game({
            roomCode, duration: duration || 20, host: playerState._id,
            players: [playerState._id], currentTurn: playerState._id, status: 'waiting',
        });
        await newGame.save({ session });
        
        playerState.gameId = newGame._id;
        await playerState.save({ session });
        newGame.host = playerState._id;

        const squareTemplates = await SquareTemplate.find().session(session);
        
        if (!squareTemplates || squareTemplates.length === 0) {
            await session.abortTransaction();
            console.error('❌ [API] No square templates found');
            return res.status(500).json({
                success: false,
                message: 'Board templates not initialized. Please contact administrator.'
            });
        }

        const squareStates = squareTemplates.map(template => ({
            squareId: template._id, roomId: newGame._id, owner: null, level: 0, isMortgage: false
        }));
        
        const createdSquareStates = await SquareState.insertMany(squareStates, { session });
        const squareStateIds = createdSquareStates.map(ss => ss._id);
        
        newGame.boardState = squareStateIds;
        await newGame.save({ session });

        await session.commitTransaction();

        const populatedGame = await Game.findById(newGame._id)
            .populate({ path: 'players', populate: { path: 'userId', select: 'name email avatar' } })
            .populate({ path: 'host', populate: { path: 'userId', select: 'name email avatar' } });

        res.status(201).json({
            success: true, message: 'Game created successfully', game: populatedGame,
            gameId: newGame._id, roomCode: newGame.roomCode, playerStateId: playerState._id, isHost: true
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('❌ [API] Create game error:', error);
        res.status(500).json({
            success: false, message: error.message || 'Failed to create game',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        session.endSession();
    }
};

// ✅ JOIN GAME (GUEST) - Logic tham gia phòng và emit real-time
exports.joinGame = async (req, res) => {
    const userId = req.user.id;
    const { roomCode } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const game = await Game.findOne({ roomCode, status: 'waiting' }).session(session);

        if (!game) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Game not found or already started' }); }
        if (game.players.length >= 4) { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'Game is full (max 4 players)' }); }

        const existingPlayer = await PlayerState.findOne({ userId, gameId: game._id }).session(session);
        if (existingPlayer) { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'You are already in this game' }); }

        const playerState = new PlayerState({ userId, gameId: game._id, money: 8000, position: 0, pet: null, ready: false });
        await playerState.save({ session });

        game.players.push(playerState._id);
        await game.save({ session });

        await session.commitTransaction();

        const io = req.app.get('io'); 
        const populatedGameForEmit = await Game.findById(game._id)
            .populate({ path: 'players', populate: { path: 'userId', select: 'name email avatar' } })
            .populate('host');

        if (io) { io.to(game.roomCode).emit('GAME_UPDATED', { game: populatedGameForEmit, message: 'Người chơi mới đã tham gia.' }); }

        const populatedGame = await Game.findById(game._id)
            .populate({ path: 'players', populate: { path: 'userId', select: 'name email avatar' } })
            .populate({ path: 'host', populate: { path: 'userId', select: 'name email avatar' } });

        const isHost = game.host?.toString() === playerState._id.toString();

        res.json({
            success: true, message: 'Joined game successfully', game: populatedGame,
            gameId: game._id, roomCode: game.roomCode, playerStateId: playerState._id, isHost
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('❌ [API] Join game error:', error);
        res.status(500).json({ success: false, message: 'Failed to join game', error: error.message });
    } finally {
        session.endSession();
    }
};

// ✅ SET READY - Logic cập nhật trạng thái sẵn sàng và emit real-time
exports.setReady = async (req, res) => {
    try {
        const { roomCode, playerStateId, pet, ready } = req.body;
        const userId = req.user.id;

        const game = await Game.findOne({ roomCode, status: 'waiting' });
        if (!game) { return res.status(404).json({ success: false, message: 'Game not found or already started' }); }

        const playerState = await PlayerState.findById(playerStateId);
        if (!playerState) { return res.status(404).json({ success: false, message: 'Player not found' }); }
        if (playerState.userId.toString() !== userId) { return res.status(403).json({ success: false, message: 'Unauthorized' }); }

        if (pet && ready) {
            const otherPlayerWithSamePet = await PlayerState.findOne({ gameId: game._id, pet: pet, _id: { $ne: playerStateId } });
            if (otherPlayerWithSamePet) { return res.status(400).json({ success: false, message: 'This pet is already chosen by another player' }); }
        }

        playerState.pet = pet; playerState.ready = ready; await playerState.save();

        const io = req.app.get('io');
        const populatedGame = await Game.findById(game._id)
            .populate({ path: 'players', populate: { path: 'userId', select: 'name email avatar' } })
            .populate({ path: 'host', populate: { path: 'userId', select: 'name email avatar' } });

        if (io) { io.to(game.roomCode).emit('GAME_UPDATED', { game: populatedGame, message: `Người chơi ${playerState.ready ? 'đã sẵn sàng' : 'đã hủy sẵn sàng'}.` }); }
        
        res.json({ success: true, message: 'Ready status updated', game: populatedGame, playerState: { _id: playerState._id, pet: playerState.pet, ready: playerState.ready } });
    } catch (error) {
        console.error('❌ [API] Set ready error:', error);
        res.status(500).json({ success: false, message: 'Failed to set ready', error: error.message });
    }
};

// ✅ START GAME - Logic đã được di chuyển sang file game.start.controller.js
exports.startGame = startGame;

// ✅ GET GAME INFO & GET GAME BY ROOM CODE - Logic không thay đổi
exports.getGameInfo = async (req, res) => {
    const { gameId } = req.params;

    try {
        const game = await Game.findById(gameId)
            .populate({ path: 'players', populate: { path: 'userId', select: 'name email avatar' } })
            .populate({ path: 'host', populate: { path: 'userId', select: 'name email avatar' } });

        if (!game) { return res.status(404).json({ success: false, message: 'Game not found' }); }

        const userId = req.user.id;
        const playerState = await PlayerState.findOne({ userId, gameId: game._id });

        if (!playerState) { return res.status(404).json({ success: false, message: 'You are not in this game' }); }

        const isHost = game.host?.toString() === playerState._id.toString();

        res.status(200).json({ success: true, game, isHost, playerStateId: playerState._id });

    } catch (error) {
        console.error('❌ [API] Get game info error:', error);
        res.status(500).json({ success: false, message: 'Failed to get game info', error: error.message });
    }
};

exports.getGameByRoomCode = async (req, res) => {
    try {
        const { roomCode } = req.params;

        const game = await Game.findOne({ roomCode })
            .populate({ path: 'players', populate: { path: 'userId', select: 'name email avatar' } })
            .populate({ path: 'host', populate: { path: 'userId', select: 'name email avatar' } });

        if (!game) { return res.status(404).json({ success: false, message: 'Game not found' }); }

        const userId = req.user.id;
        const playerState = await PlayerState.findOne({ userId, gameId: game._id });

        if (!playerState) { return res.status(403).json({ success: false, message: 'You are not in this game' }); }

        const isHost = game.host?.toString() === playerState._id.toString();

        res.json({ success: true, game, playerStateId: playerState._id, isHost });
    } catch (error) {
        console.error('❌ [API] Get game by room code error:', error);
        res.status(500).json({ success: false, message: 'Failed to get game', error: error.message });
    }
};

// 🔥 FIX: EXPORT các hàm cần thiết
module.exports = {
    createGame: exports.createGame, joinGame: exports.joinGame, setReady: exports.setReady,
    getGameInfo: exports.getGameInfo, getGameByRoomCode: exports.getGameByRoomCode, startGame: exports.startGame,
};
