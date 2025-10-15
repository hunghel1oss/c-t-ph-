// models/Game.model.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomCode: { type: String, unique: true, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState', required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState' }],
  boardState: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SquareState' }],
  // 🔥 FIX: Thêm required: true vì các trường này được gán ngay khi game bắt đầu
  currentTurn: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState', required: true }, 
  turnOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState', required: true }], 
  status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' },
  duration: { type: Number, default: 20 }, // minutes
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime: { type: Date },
  endTime: { type: Date }
}, { timestamps: true });

gameSchema.index({ roomCode: 1 });
gameSchema.index({ status: 1 });

module.exports = mongoose.model('Game', gameSchema);
