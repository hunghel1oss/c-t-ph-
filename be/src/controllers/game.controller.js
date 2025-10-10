const Game = require('../models/game.model');
const mongoose = require('mongoose');
const PlayerState = require('../models/playerState.model');
const SquareState = require('../models/squareState.model');
const Card = require('../models/card.model');
const SquareTemplate = require('../models/SquareTemplate.model');

// Tạo code phòng ngẫu nhiên
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

// ✅ TẠO GAME
exports.createGame = async (req, res) => {
    const userId = req.user.id; // lấy từ middleware protect
    const { duration } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Xóa các game cũ của user
        await SquareState.deleteMany({}, { session });
        await Game.deleteMany({ players: { $in: [userId] } }, { session });
        await PlayerState.deleteMany({ userId }, { session });
        await Card.deleteMany({ owner: userId }, { session });

        const roomCode = await generateRoomCode();

        // Tạo PlayerState
        const playerState = new PlayerState({
            userId,
            money: 3000,
            position: 0
        });
        await playerState.save({ session });

        // Tạo SquareStates
        const squareTemplates = await SquareTemplate.find().session(session);
        const squareStates = squareTemplates.map(template => ({
            squareId: template._id,
            owner: null,
            level: 0,
            isMortgage: false
        }));
        const createdSquareStates = await SquareState.insertMany(squareStates, { session });
        const squareStateIds = createdSquareStates.map(ss => ss._id);

        // Tạo Game
        const newGame = new Game({
            roomCode,
            duration: duration || 20,
            players: [playerState._id],
            currentTurn: playerState._id,
            status: 'waiting',
            boardState: squareStateIds
        });
        await newGame.save({ session });

        // Gắn gameId cho playerState
        playerState.gameId = newGame._id;
        await playerState.save({ session });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Game created successfully',
            gameId: newGame._id,
            roomCode: newGame.roomCode,
            playerStateId: playerState._id
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Create game error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create game',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// ✅ JOIN GAME
exports.joinGame = async (req, res) => {
    const userId = req.user.id;
    const { roomCode } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const game = await Game.findOne({ roomCode, status: 'waiting' }).session(session);

        if (!game) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Game not found' });
        }

        if (game.players.length >= 4) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Game is full' });
        }

        const existingPlayer = await PlayerState.findOne({
            userId,
            gameId: game._id
        }).session(session);

        if (existingPlayer) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'User already in game' });
        }

        const playerState = new PlayerState({
            userId,
            gameId: game._id,
            money: 3000,
            position: 0
        });
        await playerState.save({ session });

        game.players.push(playerState._id);
        await game.save({ session });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Game joined successfully',
            gameId: game._id,
            roomCode: game.roomCode,
            playerStateId: playerState._id
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Join game error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join game',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// ✅ START GAME
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

exports.startGame = async (req, res) => {
    const { gameId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const game = await Game.findById(gameId).session(session);

        if (!game) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Game not found' });
        }

        if (game.status !== 'waiting') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Game is already started' });
        }

        if (game.players.length < 2 || game.players.length > 4) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Game must have at least 2 and at most 4 players'
            });
        }

        const shuffledPlayers = shuffleArray([...game.players]);
        game.turnOrder = shuffledPlayers;
        game.currentTurn = shuffledPlayers[0];
        game.status = 'in_progress';

        await game.save({ session });
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Game started successfully',
            game
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Start game error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start game',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// ✅ ROLL DICE
exports.rollDice = async (req, res) => {
    const { gameId, playerStateId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const game = await Game.findById(gameId).session(session);
        const playerState = await PlayerState.findById(playerStateId).session(session);

        if (!game) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Game not found' });
        }

        if (!playerState) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        if (game.currentTurn.toString() !== playerState._id.toString()) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'It is not your turn' });
        }

        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const totalRoll = dice1 + dice2;

        const oldPosition = playerState.position;
        let newPosition = (playerState.position + totalRoll);

        if (newPosition >= 32) {
            playerState.money += 300;
        }

        newPosition = newPosition % 32;
        playerState.position = newPosition;
        await playerState.save({ session });

        const currentTurnIndex = game.turnOrder.indexOf(game.currentTurn);
        const nextTurnIndex = (currentTurnIndex + 1) % game.turnOrder.length;
        game.currentTurn = game.turnOrder[nextTurnIndex];
        await game.save({ session });

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Dice rolled successfully',
            diceRoll: [dice1, dice2],
            newPosition,
            currentTurn: game.currentTurn
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Roll dice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to roll dice',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// ✅ PROCESS SQUARE
exports.processSquare = async (req, res) => {
    const { gameId, playerStateId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const game = await Game.findById(gameId).session(session);
        const playerState = await PlayerState.findById(playerStateId).session(session);

        if (!game || !playerState) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Game or PlayerState not found' });
        }

        const position = playerState.position;
        const squareState = await SquareState.findById(game.boardState[position]).session(session);

        if (!squareState) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Square not found' });
        }

        const squareTemplate = await SquareTemplate.findById(squareState.squareId).session(session);

        if (!squareTemplate) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Square template not found' });
        }

        let action = {};

        switch (squareTemplate.type) {
            case 'property':
                if (!squareState.owner) {
                    if (playerState.money >= squareTemplate.price) {
                        action = {
                            type: 'prompt_buy',
                            square: squareTemplate,
                            message: `Bạn có muốn mua ${squareTemplate.name} với giá ${squareTemplate.price} không?`,
                            nextActionEndpoint: '/game/extra/buy_square'
                        };
                    } else {
                        action = {
                            type: 'cannot_buy',
                            message: `Bạn không đủ tiền để mua ${squareTemplate.name}.`
                        };
                    }
                } else if (squareState.owner.toString() === playerState._id.toString()) {
                    action = {
                        type: 'my_property',
                        message: 'Đây là đất của bạn. Bạn có thể xây nhà.',
                        nextActionEndpoint: '/game/extra/upgrade'
                    };
                } else {
                    action = {
                        type: 'pay_rent',
                        square: squareTemplate,
                        ownerId: squareState.owner,
                        message: `Bạn đã dừng tại ô ${squareTemplate.name} của người khác. Bạn cần phải trả tiền thuê.`,
                        nextActionEndpoint: '/game/extra/pay_rent'
                    };
                }
                break;
            case 'tax':
                action = {
                    type: 'tax',
                    message: 'Bạn cần phải trả tiền thuế.',
                    nextActionEndpoint: '/game/extra/pay_tax'
                };
                break;
            case 'chance':
                action = {
                    type: 'chance',
                    message: 'Bạn đang ở ô Cơ Hội, hãy rút một lá thẻ.',
                    nextActionEndpoint: '/game/extra/draw_card'
                };
                break;
            case 'jail':
                action = {
                    type: 'jail',
                    message: 'Bạn đang ở ô Tù. Bạn có thể ra khỏi tù vào lượt sau.',
                    nextActionEndpoint: '/game/extra/jail'
                };
                break;
            case 'go':
                action = {
                    type: 'start',
                    message: 'Bạn đã đi qua ô Start và được nhận 300.',
                    nextActionEndpoint: '/game/extra/go'
                };
                break;
            case 'world_cup':
                action = {
                    type: 'festival',
                    message: 'Bạn đã dừng tại ô World Cup.',
                    nextActionEndpoint: '/game/extra/world_cup'
                };
                break;
            case 'go_to_plane':
                action = {
                    type: 'plane',
                    message: 'Bạn dang dừng tại ô Plane.',
                    nextActionEndpoint: '/game/extra/plane'
                };
                break;
            case 'bai_bien':
                action = {
                    type: 'railroad',
                    message: 'Bạn dang dừng tại ô Bài Biến.',
                    nextActionEndpoint: '/game/extra/railroad'
                };
                break;
            default:
                action = {
                    type: 'no_action',
                    message: `Bạn đã dừng tại ô ${squareTemplate.name}.`,
                    nextActionEndpoint: null
                };
                break;
        }

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Square processed successfully',
            action,
            playerMoney: playerState.money
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Process square error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process square',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};
