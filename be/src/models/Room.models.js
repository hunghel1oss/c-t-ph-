const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: String,
    pet: {
      type: String,
      enum: ['dog', 'cat', 'car', 'ship', null],
      default: null,
    },
    ready: {
      type: Boolean,
      default: false,
    },
  }],
  duration: {
    type: Number,
    default: 20, // minutes
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting',
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
  },
}, {
  timestamps: true,
});

// Index for faster lookup
roomSchema.index({ roomCode: 1 });
roomSchema.index({ status: 1 });

module.exports = mongoose.model('Room', roomSchema);
