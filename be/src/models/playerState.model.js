// models/PlayerState.model.js
const mongoose = require('mongoose');

const playerStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  money: { type: Number, default: 3000 },
  position: { type: Number, default: 0 },
  inJail: { type: Boolean, default: false },
  jailTurns: { type: Number, default: 0 },
  properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SquareState' }],
  card: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  doubleTurns: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PlayerState', playerStateSchema);
