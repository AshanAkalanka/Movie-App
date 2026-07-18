const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, trim: true, maxlength: 60, index: true },
    genres: [{ type: String, trim: true, maxlength: 40 }],
    posterUrl: { type: String, required: true, trim: true, maxlength: 1000 },
    backdropUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    youtubeVideoId: { type: String, required: true, match: /^[A-Za-z0-9_-]{11}$/ },
    actors: [{ type: String, trim: true, maxlength: 100 }],
    director: { type: String, trim: true, maxlength: 120, default: '' },
    releaseYear: { type: Number, min: 1888, max: 2100 },
    duration: { type: String, trim: true, maxlength: 30, default: '' },
    maturityRating: { type: String, trim: true, maxlength: 20, default: 'PG' },
    language: { type: String, trim: true, maxlength: 50, default: 'English' },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, min: 0, max: 100000, default: 0 },
    playCount: { type: Number, min: 0, default: 0, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, versionKey: false });

movieSchema.index({ title: 'text', description: 'text', category: 'text', actors: 'text', genres: 'text' });
movieSchema.index({ published: 1, category: 1, sortOrder: 1, createdAt: -1 });

module.exports = mongoose.model('Movie', movieSchema);
