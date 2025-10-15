const mongoose = require('mongoose');
const PlayerState = require('../models/playerState.model');
const SquareState = require('../models/squareState.model');
const SquareTemplate = require('../models/SquareTemplate.model');
const Game = require('../models/game.model');
// ✅ FIX: Import các hàm helper từ file gameHelper.js mới
const { getLevelFromSquare, setLevelToSquare } = require('./gameHelper'); 

// tính giá trị bán lại 1 property (50%)
const calculateSellValue = (squareState, template) => {
    const level = getLevelFromSquare(squareState) || 0;
    const buildCosts = template.buildCost || {};

    let invested = 0;
    // Sử dụng logic cấp độ đúng
    if (level >= 1) invested += buildCosts.house1 || 0;
    if (level >= 2) invested += buildCosts.house2 || 0;
    if (level >= 3) invested += buildCosts.house3 || 0;
    if (level === 4) invested += buildCosts.hotel || 0;

    const basePrice = template.price || 0;
    return Math.floor((basePrice + invested) * 0.5);
};

// ép bán 1 property
const forceSellProperty = async (player, squareState, session) => {
    const template = await SquareTemplate.findById(squareState.squareId).session(session);
    if (!template) throw new Error('Square template not found during force sell');

    const sellValue = calculateSellValue(squareState, template);

    player.money += sellValue;
    
    // ✅ FIX: Sử dụng setLevelToSquare để đảm bảo reset level
    setLevelToSquare(squareState, 0); 
    squareState.owner = null; 

    await player.save({ session });
    await squareState.save({ session });

    return sellValue;
};

const handlePayment = async (playerId, amount, gameId, mode = 'cheapFirst', propertiesToSell = []) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const player = await PlayerState.findById(playerId).session(session);
        const game = await Game.findById(gameId).session(session);

        if (!player || !game) throw new Error('Player or Game not found');

        // đủ tiền thì trừ luôn
        if (player.money >= amount) {
            player.money -= amount;
            await player.save({ session });
            await session.commitTransaction();
            return { status: 'paid', playerMoney: player.money };
        }

        // nếu thiếu tiền → xử lý theo mode
        let moneyRaised = 0;
        if (mode === 'manual') {
            // bán theo danh sách propertiesToSell
            for (let sqId of propertiesToSell) {
                const sq = await SquareState.findById(sqId).session(session);
                if (sq && sq.owner && sq.owner.toString() === player._id.toString()) {
                    moneyRaised += await forceSellProperty(player, sq, session);
                    if (player.money + moneyRaised >= amount) break;
                }
            }
        } else {
            // auto bán theo giá
            const properties = await SquareState.find({ owner: player._id }).session(session);
            const propertyValues = [];

            for (let sq of properties) {
                const template = await SquareTemplate.findById(sq.squareId).session(session);
                const value = calculateSellValue(sq, template);
                propertyValues.push({ sq, value });
            }

            if (mode === 'expensiveFirst') {
                propertyValues.sort((a, b) => b.value - a.value);
            } else {
                propertyValues.sort((a, b) => a.value - b.value);
            }

            for (let { sq } of propertyValues) {
                moneyRaised += await forceSellProperty(player, sq, session);
                if (player.money + moneyRaised >= amount) break;
            }
        }

        player.money += moneyRaised;

        if (player.money >= amount) {
            player.money -= amount;
            await player.save({ session });
            await session.commitTransaction();
            return { status: 'sold', playerMoney: player.money, sold: true, mode };
        }

        // bankrupt nếu vẫn không đủ
        player.money = 0;
        player.cards = [];
        await player.save({ session });

        // thêm player vào danh sách xếp hạng
        if (!game.rankings) game.rankings = [];
        game.rankings.push(player._id);

        // xóa khỏi lượt chơi
        game.turnOrder = game.turnOrder.filter(id => id.toString() !== player._id.toString());

        // nếu chỉ còn 1 người => kết thúc
        if (game.turnOrder.length === 1) {
            game.status = 'finished';
            game.winner = game.turnOrder[0];
            game.rankings.push(game.winner); // thêm người thắng cuối cùng
        }

        await game.save({ session });
        await session.commitTransaction();
        return { status: 'bankrupt', playerMoney: 0, bankrupt: true, mode };

    } finally {
        session.endSession();
    }
};

const getRankings = async (gameId) => {
    try {
        const game = await Game.findById(gameId)
            .populate('rankings', 'name avatar') // lấy thêm thông tin người chơi
            .populate('winner', 'name avatar');

        if (!game) throw new Error('Game not found');

        // nếu game chưa kết thúc thì chỉ trả danh sách bankrupt tạm thời
        const rankings = game.rankings.map((player, idx) => ({
            rank: idx + 1,
            playerId: player._id,
            name: player.name,
            avatar: player.avatar || null
        }));

        // nếu game đã kết thúc thì winner đã được thêm vào cuối rankings
        if (game.status === 'finished' && game.winner) {
            return {
                status: 'finished',
                rankings
            };
        }

        return {
            status: game.status,
            rankings
        };
    } catch (err) {
        console.error('getRankings error:', err);
        throw err;
    }
};

module.exports = {
    handlePayment,
    getRankings,
    forceSellProperty
};