const mongoose = require('mongoose');

const postSchema = new mongooose.Schema({
    userId: { type: mongooose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongooose.model('Post', postSchema);