/**
 * game.extra.controller.js
 * Các API mở rộng cho game: buyProperty, payRent, drawCard, upgradeProperty, bankrupt
 * - Không sửa file game.controller.js gốc.
 * - Dùng transaction giống style trong game.controller.js.
 * - Chú ý: model SquareState trong repo của bạn có thể có tên trường 'owen'/'lever' (typo).
 *   Trong code này mình xử lý cả hai khả năng (owner || owen; level || lever) để không phá vỡ dữ liệu hiện có.
 */

const mongoose = require('mongoose');
const Game = require('../models/game.model');
const PlayerState = require('../models/playerState.model');
const SquareState = require('../models/squareState.model');
const SquareTemplate = require('../models/SquareTemplate.model');
const Card = require('../models/card.model');
const { handlePayment, getRankings, forceSellProperty } = require('../utils/paymentHelper');


const getOwnerFromSquare = (squareState) => { // lay Id cua o dat, kiem tra xem cos truong owner || owen khong
  return squareState.owner || squareState.owen || null;// neu khong co thi tra ve null
};
const setOwnerToSquare = (squareState, ownerId) => { // gan ownerId vao truong owner || owen
  squareState.owner = ownerId; // gan ownerId vao truong owner
  squareState.owen = ownerId;// gan ownerId vao truong owen
};
const getLevelFromSquare = (squareState) => { // lay level cua o dat
  return (typeof squareState.level !== 'undefined') ? squareState.level : (squareState.lever || 0); // neu khong co truong level thi lay truong lever
};
const setLevelToSquare = (squareState, level) => { // gan level vao truong level
  squareState.level = level; // gan level vao truong level
  squareState.lever = level; // gan level vao truong lever
};

exports.buySquare = async (req, res) => {
    const { playerStateId, squareId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log('1. Nhận request mua đất với:');
        console.log('   playerStateId:', playerStateId);
        console.log('   squareId:', squareId);

        const playerState = await PlayerState.findById(playerStateId).session(session);
        console.log('2. Tìm playerState:', !!playerState ? 'Tìm thấy' : 'Không tìm thấy');

        if (!playerState) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Player not found' });
        }

        const game = await Game.findOne({ players: { $in: [playerStateId] } }).session(session);
        console.log('3. Tìm game:', !!game ? 'Tìm thấy' : 'Không tìm thấy');
        
        if (!game) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Game not found' });
        }
        
        const squareStateIdAtPosition = game.boardState[playerState.position];
        const squareState = await SquareState.findById(squareStateIdAtPosition).session(session);
        console.log('3. Tìm squareState:', !!squareState ? 'Tìm thấy' : 'Không tìm thấy');

        if (!squareState || squareState.squareId.toString() !== squareId) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Square state not found or invalid squareId' });
        }

        const squareTemplate = await SquareTemplate.findById(squareId).session(session);
        console.log('4. Tìm squareTemplate:', !!squareTemplate ? 'Tìm thấy' : 'Không tìm thấy');

        if (!squareTemplate) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Square template not found' });
        }

        console.log('5. Giá tiền để mua:', squareTemplate.price);
        console.log('   Tiền của người chơi:', playerState.money);

        if (squareState.owner) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Square already owned' });
        }

        if (playerState.money < squareTemplate.price) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Not enough money' });
        } 

        squareState.owner = playerState._id;
        await squareState.save({ session });
        
        playerState.properties.push(squareState._id);
        playerState.money -= squareTemplate.price;
        await playerState.save({ session });

        // Dòng này sẽ được thực thi khi mọi thay đổi đã sẵn sàng để lưu
        await session.commitTransaction();
        console.log('--- Giao dịch đã được cam kết thành công ---');
        console.log('Owner sau khi mua:', squareState.owner); // Log ngay sau khi commit thành công

        res.status(200).json({
            message: 'Square bought successfully',
            playerMoney: playerState.money,
            squareStateId: squareState._id
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Failed to buy square', error: error.message });
    } finally {
        session.endSession();
    }
};



exports.payRent = async (req, res) => {
  const { gameId, playerStateId, squareStateId } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    console.log('payRent request:', { gameId, playerStateId, squareStateId });

    const game = await Game.findById(gameId).session(session);

    console.log('1. Tìm game:', !!game ? 'Tìm thấy' : 'Không tìm thấy');
    if (!game) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Game not found' });
    }

    const renter = await PlayerState.findById(playerStateId).session(session);
    console.log('2. Tìm renter (người trả tiền thuê):', !!renter ? 'Tìm thấy' : 'Không tìm thấy');

    if (!renter) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Renter not found' });
    }

    const squareState = await SquareState.findById(squareStateId).session(session);
    console.log('3. Tìm squareState:', !!squareState ? 'Tìm thấy' : 'Không tìm thấy');

    if (!squareState) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Square not found' });
    }

    const ownerId = getOwnerFromSquare(squareState);
    console.log('4. OwnerId của ô đất:', ownerId ? ownerId.toString() : 'Chưa có chủ sở hữu');

    if (!ownerId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Square is not owned' });
    }
    if (ownerId.toString() === renter._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'You own this property' });
    }

    const ownerPlayer = await PlayerState.findOne({ _id: ownerId }).session(session);
    console.log('5. Tìm ownerPlayer (chủ sở hữu ô đất):', !!ownerPlayer ? 'Tìm thấy' : 'Không tìm thấy');

    if (!ownerPlayer) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Owner player not found' });
    }

    console.log('6. Tìm thấy ownerPlayer:', ownerPlayer);
    console.log('   Tiền của renter (người trả tiền thuê):', renter.money);
    console.log('   Tiền của ownerPlayer (chủ sở hữu ô đất):', ownerPlayer.money);
    console.log('   Level của ô đất:', getLevelFromSquare(squareState));
    console.log('   Square Template ID:', squareState.squareId);

    // Tính tiền thuê dựa trên level (nếu có)
    const template = await SquareTemplate.findById(squareState.squareId).session(session);
    const level = getLevelFromSquare(squareState) || 0;
    let rentAmount = template?.rent?.base || 0;
    if (level > 0) {
      const key = `house${level}`;
      rentAmount = template?.rent?.[key] || rentAmount;
    }

    console.log('7. Tiền thuê phải trả:', rentAmount);

    // Nếu người chơi không đủ tiền -> xử lý phá sản nhẹ (đặt tiền = 0)
    if (renter.money < rentAmount) {
      const paid = renter.money;
      renter.money = 0;
      ownerPlayer.money += paid;
      renter.isBankrupt = true;
    } else {
      renter.money -= rentAmount;
      ownerPlayer.money += rentAmount;
    }
    console.log('8. Sau khi trả tiền thuê:');
    console.log('   Tiền của renter (người trả tiền thuê):', renter.money);
    console.log('   Tiền của ownerPlayer (chủ sở hữu ô đất):', ownerPlayer.money);
    console.log('   Renter isBankrupt:', renter.isBankrupt || false);
    
    await renter.save({ session });
    await ownerPlayer.save({ session });

    await session.commitTransaction();
    return res.status(200).json({ message: 'Rent processed', rentAmount, payer: renter._id, owner: ownerPlayer._id });
  } catch (error) {
    await session.abortTransaction();
    console.error('payRent error:', error);
    return res.status(500).json({ message: 'Failed to pay rent', error: error.message });
  } finally {
    session.endSession();
  }
};

exports.drawCard = async (req, res) => {
  const { gameId, playerStateId } = req.body;
  // here we can optionally persist which cards used; for now return random card
  try {

    console.log('drawCard request:', { gameId, playerStateId });

    const cards = await Card.find({});
    if (!cards || cards.length === 0) return res.status(400).json({ message: 'No cards available' });
    const card = cards[Math.floor(Math.random() * cards.length)];
    // optionally: mark card.owner = playerStateId or record in player's hand (not implemented)
    return res.status(200).json({ message: 'Card drawn', card });
  } catch (error) {
    console.error('drawCard error:', error);
    return res.status(500).json({ message: 'Failed to draw card', error: error.message });
  }
};

exports.upgradeProperty = async (req, res) => {
    const { gameId, playerStateId, squareStateId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log('upgradeProperty request:', { gameId, playerStateId, squareStateId });

        const player = await PlayerState.findById(playerStateId).session(session);
        const squareState = await SquareState.findById(squareStateId).session(session);
        if (!player || !squareState) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Player or square not found' });
        }

        const ownerId = getOwnerFromSquare(squareState);
        if (!ownerId || ownerId.toString() !== player._id.toString()) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'You do not own this property' });
        }

        const template = await SquareTemplate.findById(squareState.squareId).session(session);
        if (!template) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Square template not found' });
        }

        const currentLevel = getLevelFromSquare(squareState) || 0;
        const nextLevel = currentLevel + 1;

        if (nextLevel > 4) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Maximum property level reached (Hotel).' });
        }

        const buildCosts = template.buildCost;
        if (!buildCosts) {
            await session.abortTransaction();
            return res.status(500).json({ message: 'Square template is missing buildCost information.' });
        }

        // map tổng chi phí mỗi cấp
        const costMap = {
            0: 0,
            1: buildCosts.house1 || 0,
            2: buildCosts.house2 || 0,
            3: buildCosts.house3 || 0,
            4: buildCosts.hotel || 0,
        };

        const currentTotalCost = costMap[currentLevel];
        const nextTotalCost = costMap[nextLevel];
        const costToPay = nextTotalCost - currentTotalCost;

        if (costToPay <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Invalid upgrade cost calculated or maximum level reached.' });
        }

        if (player.money < costToPay) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Not enough money to upgrade' });
        }

        // update money + cấp độ
        player.money -= costToPay;
        setLevelToSquare(squareState, nextLevel);

        await player.save({ session });
        await squareState.save({ session });

        await session.commitTransaction();
        
        return res.status(200).json({ 
            message: 'Property upgraded successfully', 
            squareStateId: squareState._id, 
            newLevel: nextLevel,
            costPaid: costToPay,
            playerMoney: player.money
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('upgradeProperty error:', error);
        return res.status(500).json({ message: 'Failed to upgrade property', error: error.message });
    } finally {
        session.endSession();
    }
};

exports.bankrupt = async (req, res) => {
    const { gameId, playerStateId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log('bankrupt request:', { gameId, playerStateId });

        const game = await Game.findById(gameId).session(session);
        const player = await PlayerState.findById(playerStateId).session(session);

        if (!game || !player) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Game or Player not found' });
        }

        // 1. Giải phóng toàn bộ property của player
        const ownedSquares = await SquareState.find({ owner: player._id }).session(session);

        for (let sq of ownedSquares) {
            sq.owner = null;
            sq.level = 0; // reset lại nhà
            await sq.save({ session });
        }

        // 2. Thu hồi thẻ (nếu có)
        player.cards = []; // clear card
        player.money = 0;
        await player.save({ session });

        // 3. Loại player khỏi turnOrder
        game.turnOrder = game.turnOrder.filter(
            id => id.toString() !== player._id.toString()
        );

        // 4. Check win condition
        if (game.turnOrder.length === 1) {
            game.status = 'finished';
            game.winner = game.turnOrder[0]; // player còn lại
        }

        await game.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ 
            message: 'Player went bankrupt successfully',
            playerId: player._id,
            gameId: game._id,
            remainingPlayers: game.turnOrder,
            winner: game.winner || null
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('bankrupt error:', error);
        return res.status(500).json({ message: 'Failed to process bankruptcy', error: error.message });
    } finally {
        session.endSession();
    }
};

exports.forceSellProperty = async (req, res) => {
    const { playerStateId, squareStateId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const player = await PlayerState.findById(playerStateId).session(session);
        const squareState = await SquareState.findById(squareStateId).session(session);
        const template = await SquareTemplate.findById(squareState.squareId).session(session);

        if (!player || !squareState || !template) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Player or square not found' });
        }

        // kiểm tra quyền sở hữu
        if (!squareState.owner || squareState.owner.toString() !== player._id.toString()) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Player does not own this property' });
        }

        // xác định giá bán (ví dụ 50% tổng chi phí xây dựng)
        const level = getLevelFromSquare(squareState) || 0;
        const buildCosts = template.buildCost;
        let totalInvested = 0;
        if (level >= 1) totalInvested += buildCosts.house1 || 0;
        if (level >= 2) totalInvested += buildCosts.house2 || 0;
        if (level >= 3) totalInvested += buildCosts.house3 || 0;
        if (level === 4) totalInvested += buildCosts.hotel || 0;

        const basePrice = template.price || 0;
        const totalValue = basePrice + totalInvested;
        const sellPrice = Math.floor(totalValue * 0.5);

        // update tiền và reset property
        player.money += sellPrice;
        squareState.owner = null;
        squareState.level = 0;

        await player.save({ session });
        await squareState.save({ session });

        await session.commitTransaction();
        return res.status(200).json({
            message: 'Property sold successfully',
            sellPrice,
            playerMoney: player.money,
            squareStateId: squareState._id
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('forceSellProperty error:', error);
        return res.status(500).json({ message: 'Failed to sell property', error: error.message });
    } finally {
        session.endSession();
    }
};

exports.getRankings = async (req, res) => {
    const { gameId } = req.params;
    try {
        const rankings = await getRankings(gameId);
        if (!rankings) {
            return res.status(404).json({ message: 'Game not found or no players' });
        }
        return res.status(200).json({ rankings });
    } catch (error) {
        console.error('getRankings error:', error);
        return res.status(500).json({ message: 'Failed to get rankings', error: error.message });
    }
};

exports.handlePayment = async (req, res) => {
    const { playerId, amount, gameId, mode, propertiesToSell } = req.body;
    try {
        const result = await handlePayment(playerId, amount, gameId, mode, propertiesToSell);
        return res.status(200).json({ message: 'Payment processed', result });
    } catch (error) {
        console.error('handlePayment error:', error);
        return res.status(500).json({ message: 'Failed to process payment', error: error.message });
    }
};

