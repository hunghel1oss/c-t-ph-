const mongooose = require('mongoose');

const cardSchema = new mongooose.Schema({
        name:{
        type: String,
        required: true
    },
    cardId: {
        type: Number,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['action', 'event'],
        required: true
    },
    effect: {
        type: mongooose.Schema.Types.Mixed,
        required: true
    },
    gameId: {
        type: mongooose.Schema.Types.ObjectId,
        ref: 'Game',
        default: null
    }
}, {timestamps: true});

module.exports = mongooose.model('Card', cardSchema);
