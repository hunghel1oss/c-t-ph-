const mongoose = require('mongoose');

const squareStateSchema = new mongoose.Schema({
  // Tham chiếu đến SquareTemplate
  squareId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SquareTemplate', 
    required: true 
  },
  
  // BẮT BUỘC: Tham chiếu đến Game/Room
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game', // Hoặc 'Room'
    required: true
  },
  
  // Các trường trạng thái
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerState', default: null },
  level: { type: Number, default: 0 },
  isMortgage: { type: Boolean, default: false },
}, { timestamps: true });

// ----------------------------------------------------
// 🔥 FIX DỨT ĐIỂM E11000: CHỈ CÒN CHỈ MỤC TỔNG HỢP (COMPUND INDEX)
// ----------------------------------------------------

// LƯU Ý: Đã loại bỏ hoàn toàn các lệnh .index({ squareId: 1 }, { unique: true }) 
// và các lệnh .on('index', ...) để tránh xung đột với chỉ mục đã tồn tại trong DB.

// Chỉ mục TỔNG HỢP AN TOÀN: Chỉ yêu cầu sự kết hợp (roomId + squareId) là DUY NHẤT.
// Đây là chỉ mục bạn thực sự cần cho Game Monopoly.
squareStateSchema.index({ roomId: 1, squareId: 1 }, { unique: true });
// ----------------------------------------------------

module.exports = mongoose.model('SquareState', squareStateSchema);
