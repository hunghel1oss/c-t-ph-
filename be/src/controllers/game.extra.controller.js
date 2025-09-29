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

const getOwnerFromSquare = (squareState) => {
  return squareState.owner || squareState.owen || null;
};
const setOwnerToSquare = (squareState, ownerId) => {
  squareState.owner = ownerId;
  squareState.owen = ownerId;
};
const getLevelFromSquare = (squareState) => {
  return (typeof squareState.level !== 'undefined') ? squareState.level : (squareState.lever || 0);
};
const setLevelToSquare = (squareState, level) => {
  squareState.level = level;
  squareState.lever = level;
};

exports.buyProperty = async (req, res) => {
  const { gameId, playerStateId, squareStateId } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const game = await Game.findById(gameId).session(session);
    if (!game) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Game not found' });
    }

    const player = await PlayerState.findById(playerStateId).session(session);
    if (!player) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'PlayerState not found' });
    }

    const squareState = await SquareState.findById(squareStateId).session(session);
    if (!squareState) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'SquareState not found' });
    }

    const existingOwner = getOwnerFromSquare(squareState);
    if (existingOwner) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Square already owned' });
    }

    const template = await SquareTemplate.findById(squareState.squareId).session(session);
    if (!template) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Square template not found' });
    }

    const price = template.price || 0;
    if (player.money < price) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Not enough money to buy this property' });
    }

    // Trừ tiền và gán owner
    player.money -= price;
    setOwnerToSquare(squareState, player._id);

    await player.save({ session });
    await squareState.save({ session });

    await session.commitTransaction();
    return res.status(200).json({ message: 'Property purchased', playerStateId: player._id, squareStateId: squareState._id });
  } catch (error) {
    await session.abortTransaction();
    console.error('buyProperty error:', error);
    return res.status(500).json({ message: 'Failed to buy property', error: error.message });
  } finally {
    session.endSession();
  }
};

exports.payRent = async (req, res) => {
  const { gameId, playerStateId, squareStateId } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const game = await Game.findById(gameId).session(session);
    if (!game) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Game not found' });
    }

    const renter = await PlayerState.findById(playerStateId).session(session);
    if (!renter) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Renter not found' });
    }

    const squareState = await SquareState.findById(squareStateId).session(session);
    if (!squareState) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Square not found' });
    }

    const ownerId = getOwnerFromSquare(squareState);
    if (!ownerId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Square is not owned' });
    }
    if (ownerId.toString() === renter._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'You own this property' });
    }

    const ownerPlayer = await PlayerState.findOne({ _id: ownerId }).session(session);
    if (!ownerPlayer) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Owner player not found' });
    }

    // Tính tiền thuê dựa trên level (nếu có)
    const template = await SquareTemplate.findById(squareState.squareId).session(session);
    const level = getLevelFromSquare(squareState) || 0;
    let rentAmount = template?.rent?.base || 0;
    if (level > 0) {
      const key = `house${level}`;
      rentAmount = template?.rent?.[key] || rentAmount;
    }

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

    // Tính phí nâng cấp: ưu tiên dùng buildCost.house1 hoặc tổng hợp fallback
    const currentLevel = getLevelFromSquare(squareState) || 0;
    const nextLevel = currentLevel + 1;
    const buildCost = template.buildCost?.[`house${nextLevel}`] || template.buildCost?.house1 || 0;

    if (player.money < buildCost) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Not enough money to upgrade' });
    }

    player.money -= buildCost;
    setLevelToSquare(squareState, nextLevel);

    await player.save({ session });
    await squareState.save({ session });

    await session.commitTransaction();
    return res.status(200).json({ message: 'Property upgraded', squareStateId: squareState._id, newLevel: nextLevel });
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
    const player = await PlayerState.findById(playerStateId).session(session);
    if (!player) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Player not found' });
    }

    player.isBankrupt = true;
    player.money = 0;
    await player.save({ session });

    // Trả lại tài sản cho ngân hàng: set owner = null, level = 0 (ghi vào cả 2 trường để tương thích)
    await SquareState.updateMany(
      { $or: [{ owner: player._id }, { owen: player._id }] },
      { $set: { owner: null, owen: null, level: 0, lever: 0 } },
      { session }
    );

    await session.commitTransaction();
    return res.status(200).json({ message: 'Player set bankrupt', playerId: player._id });
  } catch (error) {
    await session.abortTransaction();
    console.error('bankrupt error:', error);
    return res.status(500).json({ message: 'Failed to bankrupt player', error: error.message });
  } finally {
    session.endSession();
  }
};
