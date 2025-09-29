const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        unque: true
    },
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PlayerState'
        }
    ],
    currentTurn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlayerState'
    },
    status: {
        type: String,
        enum: ['waiting', 'in_progress', 'completed'],
        default: 'waiting'
    },
    turnOrder: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PlayerState'
        }
    ],
    boardState: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SquareState'
        }
    ],
    round: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Game', gameSchema);