const mongoose = require('mongoose');

const diceSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  playerStateId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState', default: null },
  values: [{ type: Number }], // e.g. [3,5]
  total: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DiceRoll', diceSchema);
