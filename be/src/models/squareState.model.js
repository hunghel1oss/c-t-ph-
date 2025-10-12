// models/SquareState.model.js

const mongoose = require('mongoose');

const squareStateSchema = new mongoose.Schema({
  // ✅ FIX: Đã loại bỏ "unique: true" (hoặc đảm bảo nó không tồn tại)
  //        vì mỗi phòng cần nhiều SquareState có cùng squareId (mẫu)
  squareId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SquareTemplate', 
    required: true 
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState', default: null },
  level: { type: Number, default: 0 },
  isMortgage: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('SquareState', squareStateSchema);