// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 10;

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    profileImage: user.profileImage,
    role: user.role,
    suspended: Boolean(user.suspended),
    createdAt: user.createdAt,
});

exports.register = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }
        if (name.length > 80 || email.length > 160) {
            return res.status(400).json({ message: 'Name or email is too long' });
        }
        if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
            return res.status(400).json({ message: 'Password must contain 10 to 72 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists with this email' });

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const user = new User({ name, email, password: hashedPassword, role: 'user' });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'User already exists with this email' });
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        if (email.length > 160 || password.length > 72) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });
        if (user.suspended) return res.status(403).json({ message: 'This account is currently unavailable. Please contact support.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        user.lastLoginAt = new Date();
        await user.save();

        const token = jwt.sign(
            { tokenVersion: user.tokenVersion },
            process.env.JWT_SECRET,
            {
                subject: String(user._id),
                expiresIn: '12h',
                issuer: 'screenly-api',
                audience: 'screenly-mobile',
                algorithm: 'HS256',
            }
        );

        res.json({
            token,
            user: publicUser(user)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -tokenVersion');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const phone = String(req.body.phone || '').trim();
        const address = String(req.body.address || '').trim();

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }
        if (!/^\S+@\S+\.\S+$/.test(email) || name.length > 80 || email.length > 160 || phone.length > 30 || address.length > 300) {
            return res.status(400).json({ message: 'Invalid profile details' });
        }

        const existingEmail = await User.findOne({ email, _id: mongoose.trusted({ $ne: req.user.id }) });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already used by another account' });
        }

        const profileData = {
            name,
            email,
            phone: phone || '',
            address: address || '',
        };

        const user = await User.findByIdAndUpdate(req.user.id, profileData, { new: true, runValidators: true }).select('-password -tokenVersion');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'Email already used by another account' });
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const currentPassword = String(req.body.currentPassword || '');
        const newPassword = String(req.body.newPassword || '');

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > 72 || currentPassword.length > 72) {
            return res.status(400).json({ message: 'New password must contain 10 to 72 characters' });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        user.tokenVersion += 1;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
