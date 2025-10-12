// models/SquareTemplate.model.js

const mongoose = require('mongoose');

const squareTemplateSchema = new mongoose.Schema({
  position: { type: Number, required: true, unique: true }, // Giữ unique
  name: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, default: 0 },
  rent: { // Cấu trúc rent cần khớp với dữ liệu object
    base: { type: Number, default: 0 },
    house1: { type: Number, default: 0 },
    house2: { type: Number, default: 0 },
    house3: { type: Number, default: 0 },
    hotel: { type: Number, default: 0 }
  },
  buildCost: { // Cấu trúc buildCost cần khớp
    house: { type: Number, default: 0 }, // Chi phí xây một nhà
    hotel: { type: Number, default: 0 } // Chi phí xây hotel (thường là houseCost)
  },
  color: { type: String },
  amount: { type: Number },
  housePrice: { type: Number }, // Giữ lại housePrice thô để tham chiếu
}, { timestamps: false });

module.exports = mongoose.model('SquareTemplate', squareTemplateSchema);