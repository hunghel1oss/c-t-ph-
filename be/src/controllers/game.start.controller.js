const Game = require('../models/game.model');
const mongoose = require('mongoose');
const PlayerState = require('../models/playerState.model');
// ✅ FIX: Import hàm shuffleArray từ file gameHelper.js mới
const { shuffleArray } = require('../utils/gameHelper'); 

// Hàm này sẽ thay thế exports.startGame trong game.controller.js
exports.startGame = async (req, res) => {
    const { gameId } = req.body;
    const userId = req.user.id;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const game = await Game.findById(gameId).session(session);

        if (!game) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Game not found' }); }

        // Kiểm tra Host
        const hostPlayerState = await PlayerState.findById(game.host).session(session);
        if (!hostPlayerState || hostPlayerState.userId.toString() !== userId) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Only the host can start the game' });
        }
        
        // Kiểm tra trạng thái và số lượng người chơi
        if (game.status !== 'waiting') { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'Game already started' }); }
        if (game.players.length < 2 || game.players.length > 4) { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'Game must have 2-4 players' }); }

        const playerStates = await PlayerState.find({ _id: { $in: game.players } }).session(session);
        if (!playerStates.every(p => p.ready && p.pet)) { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'All players must be ready and have pets' }); }

        // Cập nhật trạng thái game
        const playerIds = game.players.map(id => id.toString());
        const shuffledPlayers = shuffleArray(playerIds); // ✅ Sử dụng helper đã fix
        
        const updateFields = {
            turnOrder: shuffledPlayers,
            currentTurn: shuffledPlayers[0],
            status: 'in_progress',
            startedAt: new Date(),
        };

        // Dùng findOneAndUpdate an toàn
        const updatedGame = await Game.findByIdAndUpdate(
            gameId,
            { $set: updateFields },
            { new: true, session: session }
        );

        if (!updatedGame) {
             await session.abortTransaction();
             return res.status(500).json({ success: false, message: 'Failed to update game status during start' });
        }

        await session.commitTransaction();

        const io = req.app.get('io');
        
        // Populate và Emit
        let populatedGame = updatedGame; 
        try {
            populatedGame = await updatedGame.populate([
                { path: 'players', populate: { path: 'userId', select: 'name email avatar' } },
                { path: 'host', populate: { path: 'userId', select: 'name email avatar' } },
                { path: 'currentTurn', populate: { path: 'userId', select: 'name email avatar' } }
            ]);
        } catch (populateError) {
             console.error('❌ [API] Populate after Start Game failed:', populateError);
        }

        if (io) {
            io.to(updatedGame.roomCode).emit('GAME_STARTED', { game: populatedGame });
            console.log(`✅ [SOCKET] Emitted GAME_STARTED to room ${updatedGame.roomCode}`);
        }
        
        res.status(200).json({ success: true, message: 'Game started', game: populatedGame });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ [API] Start game error (CRASH SOURCE):', error);
        res.status(500).json({ success: false, message: 'Failed to start game', error: error.message });
    } finally {
        session.endSession();
    }
};
