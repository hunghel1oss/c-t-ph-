const mongooose = require('mongoose');

const playerStateSchema = new mongooose.Schema({
    userId: { type: mongooose.Schema.Types.ObjectId, ref: 'User', required: true },
    money: { type: Number, default: 3000 },
    position: { type: Number, default: 0 },
    inJail: { type: Boolean, default: false },
    jailTurns: { type: Number, default: 0 },
    properties: [{ type: mongooose.Schema.Types.ObjectId, ref: 'SquareState' }],
    card: [{ type: mongooose.Schema.Types.ObjectId, ref: 'Card' }],
    doubleTurns: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongooose.model('PlayerState', playerStateSchema);