const mongoose = require('mongoose');

const squareTemplateSchema = new mongoose.Schema({
    position: {
        type: Number,
        required: true,
        unique: true
    },
    
    name: {
        type: String,
        required: true
    },

    type: {
        type: String,
        required: true
    },
    
    price: {
        type: Number,
        default: 0
    },

    rent: {
        base: { type: Number, default: 0 },
        house1: { type: Number, default: 0 },
        house2: { type: Number, default: 0 },
        house3: { type: Number, default: 0 },
        hotel: { type: Number, default: 0 }
    },

    buildCost: {
        house1: { type: Number, default: 0 },
        house2: { type: Number, default: 0 },
        house3: { type: Number, default: 0 },
        hotel: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('SquareTemplate', squareTemplateSchema);