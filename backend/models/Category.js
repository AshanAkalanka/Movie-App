const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 60, unique: true },
    description: { type: String, trim: true, maxlength: 240, default: '' },
    protected: { type: Boolean, default: false },
    sortOrder: { type: Number, min: 0, max: 10000, default: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Category', categorySchema);
