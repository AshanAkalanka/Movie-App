const mongoose = require('mongoose');

const watchEventSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

watchEventSchema.index({ createdAt: -1 });
watchEventSchema.index({ movie: 1, createdAt: -1 });

module.exports = mongoose.model('WatchEvent', watchEventSchema);
