// models/Game.model.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomCode: { type: String, unique: true, required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState' }],
  boardState: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SquareState' }],
  currentTurn: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState' },
  turnOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState' }],
  status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' },
  duration: { type: Number, default: 20 }, // minutes
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime: { type: Date },
  endTime: { type: Date }
}, { timestamps: true });

gameSchema.index({ roomCode: 1 });
gameSchema.index({ status: 1 });

module.exports = mongoose.model('Game', gameSchema);
