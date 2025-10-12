const mongoose = require('mongoose');

const playerStateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    },
    money: {
        type: Number,
        default: 8000
    },
    position: {
        type: Number,
        default: 0
    },
    pet: {
        type: String,
        enum: ['lion', 'dragon', 'unicorn', 'phoenix', null],
        default: null
    },
    ready: {
        type: Boolean,
        default: false
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
    }],
    isInJail: {
        type: Boolean,
        default: false
    },
    jailTurns: {
        type: Number,
        default: 0
    },
    isBankrupt: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PlayerState', playerStateSchema);
