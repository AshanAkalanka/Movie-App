// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 160 },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: '', maxlength: 30 },
    address: { type: String, default: '', maxlength: 300 },
    profileImage: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    suspended: { type: Boolean, default: false, index: true },
    lastLoginAt: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('User', userSchema);
