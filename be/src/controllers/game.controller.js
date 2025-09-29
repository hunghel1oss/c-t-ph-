const Game = require('../models/game.model');
const mongoose = require('mongoose');
const PlayerState = require('../models/playerState.model');
const SquareState = require('../models/squareState.model');
const Card = require('../models/card.model');
const SquareTemplate = require('../models/SquareTemplate.model');

// tao code phong ngau nhien
const generateRoomCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // khai bao cac ki tu can su dung
    let gameCode = '';
    let isUnique = false; 

    while (!isUnique) {
        gameCode = ''; // reset gameCode voi moi vong lap
        for (let i = 0; i < 6; i++) { // tao code co 6 ki tu
            gameCode += characters.charAt(Math.floor(Math.random() * characters.length)); // chon ki tu ngau nhien va them vo gameCode
        }
        const existingGame = await Game.findOne({ roomCode: gameCode }); // kiem tra xem gameCode da ton tai chua o tren mongoose
        if (!existingGame) { // neu gameCode chua ton tai thi ket thuc vong lap
            isUnique = true; // gan isUnique = true de ket thuc vong lap
        }
    }
    return gameCode; // tra ve gameCode
};

// tao game
exports.createGame = async (req, res) => {
    const { userId } = req.body; // lay userId tu req.body

    const session = await mongoose.startSession(); // khoi tao session
    session.startTransaction(); // bat dau transaction

    try {
        await SquareState.deleteMany({}, { session }); // xoa tat ca SquareState trong database
        await Game.deleteMany({ players: { $in: [userId] } }, { session }); // xoa tat ca game co userId trong players 
        await PlayerState.deleteMany({ userId }, { session }); // xoa tat ca PlayerState co userId trong database
        await Card.deleteMany({ owner: userId }, { session }); // xoa tat ca Card co owner la userId trong database

        const roomCode = await generateRoomCode(); // tao code phong ngau nhien va gan vao roomCode
        const playerState = new PlayerState({ userId, money: 3000, position: 0 }); // tao PlayerState moi voi userId, money va position la 0
        await playerState.save({ session }); // luu PlayerState vao database voi session de ghi lai transaction trong database 
        const squareTemplates = await SquareTemplate.find().session(session); // lay tat ca SquareTemplate trong database va gan vao squareTemplates 
        const squareStates = squareTemplates.map(template => { // tao squareStates tu squareTemplates va gan vao squareStates 
            return { // tao squareState moi voi squareId, owner, level va isMortgage la false 
                squareId: template._id,
                owner: null,
                level: 0,
                isMortgage: false
            };
        });
        const createdSquareStates = await SquareState.insertMany(squareStates, { session }); // luu squareStates vao database voi session de ghi lai transaction trong database
        const squareStateIds = createdSquareStates.map(ss => ss._id); // lay tat ca _id cua squareStates va gan vao squareStateIds 
 
        const newGame = new Game({ // tao game moi voi roomCode, players, currentTurn va status la waiting
            roomCode,
            players: [playerState._id],
            currentTurn: playerState._id,
            status: 'waiting',
            boardState: squareStateIds
        });
        await newGame.save({ session }); // luu game vao database voi session de ghi lai transaction trong database
        playerState.gameId = newGame._id; // gan gameId cho playerState 
        await playerState.save({ session }); // luu playerState vao database voi session de ghi lai transaction trong database
        await session.commitTransaction(); // ket thuc transaction va luu vao database 
        res.status(201).json({ // tra ve status code 201 va thong bao thanh cong va gameId, roomCode va playerStateId
            message: 'Game created successfully',
            gameId: newGame._id,
            roomCode: newGame.roomCode,
            playerStateId: playerState._id
        });

    } catch (error) { // neu co loi thi ket thuc transaction va tra ve status code 500 va thong bao loi
        await session.abortTransaction();
        res.status(500).json({ message: 'Failed to create game', error: error.message });
    } finally { // ket thuc session 
        session.endSession();
    }
};

// join game
exports.joinGame = async (req, res) => {
    const { userId, roomCode } = req.body; // lay userId va roomCode tu req.body 
    const session = await mongoose.startSession(); // khoi tao session 
    session.startTransaction(); // bat dau transaction

    // kiem tra xem roomCode co ton tai khong
    try{ 
        const game = await Game.findOne({ roomCode, status: 'waiting' }).session(session); // tim game co roomCode va status la waiting
        if(!game){// neu khong tim thay game
            await session.abortTransaction(); // ket thuc transaction
            return res.status(404).json({ message: 'Game not found' }); // tra ve status code 404 va thong bao khong tim thay game
        }
        if (game.players.length >= 4){ // neu so luong nguoi choi trong game >= 4
            await session.abortTransaction(); // ket thuc transaction
            return res.status(400).json({ message: 'Game is full' }); // tra ve status code 400 va thong bao game da day
        }
        const existingPlayer = await PlayerState.findOne({ userId, gameId: game._id }).session(session); // tim PlayerState co userId va gameId trong game tuong ung
        if (existingPlayer){ // neu tim thay PlayerState nay trong game
            await session.abortTransaction(); // ket thuc transaction
            return res.status(400).json({ message: 'User already in game' }); // tra ve status code 400 va thong bao user da trong game
        }

        // neu khong tim thay PlayerState nay trong game thi tao PlayerState moi
        const playerState = new PlayerState({ userId, gameId: game._id }); // tao playerState moi voi userId va gameId
        await playerState.save({ session }); // luu playerState vao database voi session de ghi lai transaction trong database
        game.players.push(playerState._id); // gan playerState._id cho players cua game
        await game.save({ session }); // luu game vao database voi session de ghi lai transaction trong database

        await session.commitTransaction(); // ket thuc transaction
        res.status(201).json({ // tra ve status code 201 va thong bao thanh cong va gameId, roomCode va playerStateId
            message: 'Game joined successfully',
            gameId: game._id,
            roomCode: game.roomCode,
            playerStateId: playerState._id
        });
    }catch(error){ // neu co loi thi ket thuc transaction va tra ve status code 500 va thong bao loi
        await session.abortTransaction(); // ket thuc transaction
        res.status(500).json({ message: 'Failed to join game', error: error.message }); // tra ve status code 500 va thong bao loi
    }finally{ // ket thuc session
        session.endSession(); // ket thuc session
    }
};

// start game
const shuffleArray = (array) => { // ham ngau nhien vi tri cua cac nguoi choi
    for (let i = array.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1)); 
        [array[i], array[j]] = [array[j], array[i]]; 
    }
    return array; // tra ve mang ngau nhien
};

// start game
exports.startGame = async (req, res) =>{
    const { gameId } = req.body; // lay gameId tu req.body
    const session = await mongoose.startSession(); // khoi tao session
    session.startTransaction(); // bat dau transaction
// kiem tra xem gameId co ton tai khong
    try{
        const game = await Game.findById(gameId).session(session); // tim game co gameId
        if(!game){ // neu khong tim thay game
            await session.abortTransaction(); // ket thuc transaction
            return res.status(404).json({ message: 'Game not found' }); // tra ve status code 404 va thong bao khong tim thay game
        }

        // kiem tra xem game da bat dau chua
        if (game.status !== 'waiting'){ // neu game da bat dau
            await session.abortTransaction(); // ket thuc transaction
            return res.status(400).json({ message: 'Game is already started' }); // tra ve status code 400 va thong bao game da bat dau
        }

        // kiem tra xem so luong nguoi choi trong game co hop le khong
        if(game.players.length<2 || game.players.length >4){ // neu so luong nguoi choi trong game khong hop le
            await session.abortTransaction(); // ket thuc transaction
            return res.status(400).json({ message: 'Game must have at least 2 and at most 4 players' });// tra ve status code 400 va thong bao game phai co at least 2 va at most 4 nguoi choi
        }

        const shuffledPlayers = shuffleArray([...game.players]); // ngau nhien vi tri cua cac nguoi choi trong game
        game.turnOrder = shuffledPlayers; // gan nguoi choi ngau nhien cho turnOrder
        
        game.currentTurn = shuffledPlayers[0]; // gan nguoi choi dau tien cho currentTurn
        game.status = 'in_progress'; // gan trang thai game la in_progress
        await game.save({ session }); // luu game vao database voi session de ghi lai transaction trong database
        await session.commitTransaction(); // ket thuc transaction
        res.status(200).json({ message: 'Game started successfully', game }); // tra ve status code 200 va thong bao thanh cong
    }catch(error){ // neu co loi thi ket thuc transaction
        await session.abortTransaction(); // ket thuc transaction
        res.status(500).json({ message: 'Failed to start game', error: error.message });// tra ve status code 500 va thong bao loi
    }finally{
        session.endSession();// ket thuc session
    }
};

// roll dice
exports.rollDice = async (req,res) =>{
    const { gameId, playerStateId } = req.body; // lay gameId va playerStateId tu req.body
    const session = await mongoose.startSession();// khoi tao session
    session.startTransaction();

    // kiem tra xem gameId va playerStateId co ton tai khong
    try{
        const game = await Game.findById(gameId).session(session); // tim game co gameId trong database
        const playerState = await PlayerState.findById(playerStateId).session(session); // tim playerState co playerStateId trong database

        if(!game){ // neu khong tim thay game
            await session.abortTransaction(); // ket thuc transaction
            return res.status(404).json({ message: 'Game not found' }); // tra ve status code 404 va thong bao khong tim thay game
        }

        if(!playerState){ // neu khong tim thay playerState
            await session.abortTransaction();
            return res.status(404).json({ message: 'Player not found' });
        }

        if(game.currentTurn.toString() !== playerState._id.toString()){ // neu nguoi choi khong phai nguoi choi hien tai
            await session.abortTransaction(); // ket thuc transaction 
            return res.status(400).json({ message: 'It is not your turn' }); // tra ve status code 400 va thong bao khong phai nguoi choi hien tai
        }

        const dice1 = Math.floor(Math.random() * 6) + 1; // tao so ngau nhien tu 1 den 6
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const totalRoll = dice1 + dice2; // tinh tong so ngau nhien

        const oldPosition = playerState.position; // lay vi tri hien tai cua nguoi choi
        let newPosition = (playerState.position + totalRoll); // tinh vi tri moi cua nguoi choi

        if (newPosition >= 32){ // neu vi tri moi cua nguoi choi lon hon hoac bang 32
            playerState.money += 300; // cong 300 vao money cua nguoi choi
        }

        newPosition = newPosition % 32; // chia vi tri moi cua nguoi choi cho 32 de lay vi tri moi cua nguoi choi
        playerState.position = newPosition; // gan vi tri moi cho playerState

        await playerState.save({ session }); // luu playerState vao database voi session de ghi lai transaction trong database

        const currentTurnIndex = game.turnOrder.indexOf(game.currentTurn); // lay vi tri cua nguoi choi hien tai trong turnOrder
        const nextTurnIndex = (currentTurnIndex + 1) % game.turnOrder.length; // tinh vi tri cua nguoi choi tiep theo
        game.currentTurn = game.turnOrder[nextTurnIndex]; // gan nguoi choi tiep theo cho currentTurn
        await game.save({ session }); // luu game vao database voi session de ghi lai transaction trong database

        await session.commitTransaction(); // ket thuc transaction
        res.status(200).json({ message: 'Dice rolled successfully', diceRoll: [dice1, dice2], newPosition, currentTurn: game.currentTurn }); // tra ve status code 200 va thong bao thanh cong
    }catch(error){
        await session.abortTransaction(); // ket thuc transaction 
        res.status(500).json({ message: 'Failed to roll dice', error: error.message }); //  tra ve status code 500 va thong bao loi
    }finally{
        session.endSession(); // ket thuc session
    }
};

// xu ly square
exports.processSquare = async (req, res) => {
    const { gameId, playerStateId } = req.body; // lay gameId va playerStateId tu req.body
    const session = await mongoose.startSession();
    session.startTransaction();

    // kiem tra xem gameId va playerStateId co ton tai khong
    try {
        const game = await Game.findById(gameId).session(session); // tim game co gameId trong database
        console.log('1. Game found:', !!game); // in ra thong bao game da tim thay

        const playerState = await PlayerState.findById(playerStateId).session(session); // tim playerState co playerStateId trong database
        console.log('2. PlayerState found:', !!playerState); // in ra thong bao playerState da tim thay

        // kiem tra xem game va playerState co ton tai khong
        if (!game || !playerState) { 
            await session.abortTransaction();
            return res.status(404).json({ message: 'Game or PlayerState not found' });
        }
        
        // Lấy vị trí của người chơi từ PlayerState trong database
        const position = playerState.position;
        console.log('3. Player position:', position); // in ra thong bao vi tri cua nguoi choi
        console.log('4. Game boardState:', game.boardState); // in ra thong bao boardState cua game
        console.log('5. Game boardState:', game.boardState); // in ra thong bao boardState cua game

        const squareState = await SquareState.findById(game.boardState[position]).session(session); // tim squareState co squareId trong database theo vi tri cua nguoi choi trong boardState cua game 
        console.log('6. squareStateId at position:', squareState); // in ra thong bao squareStateId tao vi tri cua nguoi choi trong boardState

        if (!squareState) { // neu khong tim thay squareState 
            await session.abortTransaction(); // ket thuc transaction 
            return res.status(404).json({ message: 'Square not found' });
        }

        const squareTemplate = await SquareTemplate.findById(squareState.squareId).session(session); // tim SquareTemplate co squareId trong database 
         console.log('7. SquareState found:', !!squareState); // in ra thong bao squareState da tim thay 

        if (!squareTemplate) { // neu khong tim thay squareTemplate
            await session.abortTransaction();
            return res.status(404).json({ message: 'Square template not found' });
        }

        let action = {}; // khoi tao bien action

        // xu ly theo loai square
        switch (squareTemplate.type) { // neu loai cua square la property 
            case 'property': // neu loai cua square la property
                if (!squareState.owner) { // neu squareState khong co owner
                    if (playerState.money >= squareTemplate.price) { // neu nguoi choi co tien tuong ung voi gia cua square
                        action = { // gan action la prompt_buy va square la squareTemplate va message la ban co muon mua squareTemplate voi gia squareTemplate.price khong
                            type: 'prompt_buy',
                            square: squareTemplate,
                            message: `Bạn có muốn mua ${squareTemplate.name} với giá ${squareTemplate.price} không?`
                        };
                    } else { // neu nguoi choi khong co tien tuong ung voi gia cua square
                        action = { // gan action la cannot_buy va message la ban khong du tien de mua squareTemplate 
                            type: 'cannot_buy',
                            message: `Bạn không đủ tiền để mua ${squareTemplate.name}.`
                        };
                    }
                } else if (squareState.owner.toString() === playerState._id.toString()) { // neu nguoi choi la owner cua square 
                    action = { // gan action la my_property va message la squareTemplate la property cua nguoi choi
                        type: 'my_property',
                        message: 'Đây là đất của bạn. Bạn có thể xây nhà.'
                    };
                } else { // neu nguoi choi khong phai owner cua square
                    action = { // gan action la pay_rent va square la squareTemplate, ownerId la owner cua square va message la nguoi choi khong phai owner cua square
                        type: 'pay_rent',
                        square: squareTemplate,
                        ownerId: squareState.owner,
                        message: `Bạn đã dừng tại ô ${squareTemplate.name} của người khác. Bạn cần phải trả tiền thuê.`
                    };
                }
                break; // ket thuc switch
            case 'tax': // neu loai cua square la tax
                action = { // gan action la tax va message la nguoi choi khong phai owner cua square
                    type: 'tax',
                    message: 'Bạn cần phải trả tiền thuế.'
                };
                break; // ket thuc switch
            case 'chance': // neu loai cua square la chance
                action = { // gan action la chance va message la nguoi choi khong phai owner cua square
                    type: 'chance',
                    message: 'Bạn đang ở ô Cơ Hội, hãy rút một lá thẻ.'
                };
                break;
            case 'jail':
                action = {
                    type: 'jail',
                    message: 'Bạn đang ở ô Tù. Bạn có thể ra khỏi tù vào lượt sau.'
                };
                break;
            case 'go':
                action = {
                    type: 'start',
                    message: 'Bạn đã đi qua ô Start và được nhận 300.'
                };
                break;
            case 'world_cup':
                action = {
                    type: 'festival',
                    message: 'Bạn đã dừng tại ô World Cup.'
                };
                break;
            case 'go_to_plane':
                action = {
                    type: 'plane',
                    message: 'Bạn dang dừng tại ô Plane.'
                };
                break;
            case 'bai_bien':
                action = {
                    type: 'railroad',
                    message: 'Bạn dang dừng tại ô Bài Biến.'
                };
                break;
            default:
                action = {
                    type: 'no_action',
                    message: `Bạn đã dừng tại ô ${squareTemplate.name}.`
                };
                break;
        }

        await session.commitTransaction(); // ket thuc transaction
        res.status(200).json({  // tra ve status code 200 va thong bao Square processed successfully
            message: 'Square processed successfully', 
            action, 
            playerMoney: playerState.money 
        });

    } catch (error) { // neu co loi
        await session.abortTransaction(); // ket thuc transaction
        res.status(500).json({ message: 'Failed to process square', error: error.message }); // tra ve status code 500 va thong bao loi
    } finally {
        session.endSession(); // ket thuc session
    }
};

exports