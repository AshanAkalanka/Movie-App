const mongoose = require('mongoose');
const User = require('../models/User');
const Movie = require('../models/Movie');
const WatchEvent = require('../models/WatchEvent');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');
const { detectImageExtension, removeUploadedFile } = require('../middleware/uploadMiddleware');

const publicAdminUser = (user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    suspended: Boolean(user.suspended),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
});

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function publicCategory(category, movieCount = 0) {
    return {
        id: String(category._id),
        name: category.name,
        description: category.description || '',
        protected: Boolean(category.protected),
        sortOrder: category.sortOrder || 0,
        movieCount,
    };
}

exports.getStats = async (req, res, next) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [totalUsers, suspendedUsers, newUsers, totalMovies, publishedMovies, featuredMovies, playsLast7Days, categoryRows, topMovies, recentUsers] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ suspended: true }),
            User.countDocuments({ createdAt: mongoose.trusted({ $gte: sevenDaysAgo }) }),
            Movie.countDocuments(),
            Movie.countDocuments({ published: true }),
            Movie.countDocuments({ featured: true, published: true }),
            WatchEvent.countDocuments({ createdAt: mongoose.trusted({ $gte: sevenDaysAgo }) }),
            Movie.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
            Movie.find({ published: true }).sort({ playCount: -1, createdAt: -1 }).limit(5).select('title posterUrl playCount category').lean(),
            User.find().sort({ createdAt: -1 }).limit(5).select('name email role suspended createdAt lastLoginAt').lean(),
        ]);
        const totalPlays = await Movie.aggregate([{ $group: { _id: null, count: { $sum: '$playCount' } } }]);
        res.json({
            summary: {
                totalUsers,
                activeUsers: totalUsers - suspendedUsers,
                suspendedUsers,
                newUsers,
                totalMovies,
                publishedMovies,
                draftMovies: totalMovies - publishedMovies,
                featuredMovies,
                totalPlays: totalPlays[0]?.count || 0,
                playsLast7Days,
            },
            categories: categoryRows.map((row) => ({ name: row._id || 'Uncategorized', count: row.count })),
            topMovies: topMovies.map((movie) => ({ ...movie, id: String(movie._id), _id: undefined })),
            recentUsers: recentUsers.map(publicAdminUser),
        });
    } catch (error) {
        next(error);
    }
};

exports.listUsers = async (req, res, next) => {
    try {
        const search = String(req.query.search || '').trim().slice(0, 100);
        const filter = search ? { $or: [{ name: new RegExp(escapeRegex(search), 'i') }, { email: new RegExp(escapeRegex(search), 'i') }] } : {};
        const users = await User.find(filter).sort({ createdAt: -1 }).limit(200).select('name email role suspended createdAt lastLoginAt').lean();
        res.json({ users: users.map(publicAdminUser) });
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Member not found' });
        if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: 'You cannot change your own administrator access here' });
        const updates = {};
        if (req.body.role !== undefined) {
            if (!['user', 'admin'].includes(req.body.role)) return res.status(400).json({ message: 'Choose a valid member role' });
            updates.role = req.body.role;
        }
        if (req.body.suspended !== undefined) updates.suspended = req.body.suspended === true;
        if (!Object.keys(updates).length) return res.status(400).json({ message: 'No member changes were provided' });
        const user = await User.findByIdAndUpdate(req.params.id, { $set: updates, $inc: { tokenVersion: 1 } }, { new: true, runValidators: true }).select('name email role suspended createdAt lastLoginAt');
        if (!user) return res.status(404).json({ message: 'Member not found' });
        res.json({ user: publicAdminUser(user) });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Member not found' });
        if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: 'You cannot delete your own administrator account' });
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'Member not found' });
        await WatchEvent.deleteMany({ user: user._id });
        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        next(error);
    }
};

exports.uploadImage = async (req, res, next) => {
    let temporaryPath = req.file?.path;
    try {
        if (!temporaryPath) return res.status(400).json({ message: 'Choose an image from your device.' });
        const extension = await detectImageExtension(temporaryPath);
        if (!extension) {
            await fs.promises.unlink(temporaryPath).catch(() => {});
            return res.status(400).json({ message: 'This file is not a supported image.' });
        }
        const finalPath = temporaryPath.replace(/\.upload$/, `.${extension}`);
        await fs.promises.rename(temporaryPath, finalPath);
        temporaryPath = '';
        const publicPath = `/uploads/${path.basename(finalPath)}`;
        res.status(201).json({ path: publicPath, url: `${req.protocol}://${req.get('host')}${publicPath}` });
    } catch (error) {
        if (temporaryPath) await fs.promises.unlink(temporaryPath).catch(() => {});
        next(error);
    }
};

exports.deleteImage = async (req, res, next) => {
    try {
        const removed = await removeUploadedFile(req.body.path);
        res.json({ removed });
    } catch (error) {
        next(error);
    }
};

exports.listCategories = async (req, res, next) => {
    try {
        const [categories, counts] = await Promise.all([
            Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
            Movie.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
        ]);
        const countMap = new Map(counts.map((item) => [item._id, item.count]));
        res.json({ categories: categories.map((category) => publicCategory(category, countMap.get(category.name) || 0)) });
    } catch (error) {
        next(error);
    }
};

exports.createCategory = async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
        const description = String(req.body.description || '').trim();
        if (name.length < 2 || name.length > 60) return res.status(400).json({ message: 'Category names must contain 2 to 60 characters.' });
        if (description.length > 240) return res.status(400).json({ message: 'Keep the category description under 240 characters.' });
        const duplicate = await Category.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
        if (duplicate) return res.status(409).json({ message: 'That category already exists.' });
        const category = await Category.create({ name, description, protected: false, sortOrder: 100, createdBy: req.user.id });
        res.status(201).json({ category: publicCategory(category) });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'That category already exists.' });
        next(error);
    }
};

exports.updateCategory = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Category not found' });
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        const nextName = String(req.body.name || category.name).trim().replace(/\s+/g, ' ');
        const description = String(req.body.description ?? category.description).trim();
        if (category.protected && nextName !== category.name) return res.status(400).json({ message: 'Built-in category names are kept to protect your current catalog.' });
        if (nextName.length < 2 || nextName.length > 60) return res.status(400).json({ message: 'Category names must contain 2 to 60 characters.' });
        const duplicate = await Category.findOne({ _id: mongoose.trusted({ $ne: category._id }), name: new RegExp(`^${escapeRegex(nextName)}$`, 'i') });
        if (duplicate) return res.status(409).json({ message: 'That category already exists.' });
        const previousName = category.name;
        category.name = nextName;
        category.description = description.slice(0, 240);
        if (Number.isInteger(req.body.sortOrder)) category.sortOrder = req.body.sortOrder;
        await category.save();
        if (previousName !== nextName) await Movie.updateMany({ category: previousName }, { $set: { category: nextName } });
        const movieCount = await Movie.countDocuments({ category: nextName });
        res.json({ category: publicCategory(category, movieCount) });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'That category already exists.' });
        next(error);
    }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Category not found' });
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        if (category.protected) return res.status(400).json({ message: 'Built-in categories always remain available.' });
        const movieCount = await Movie.countDocuments({ category: category.name });
        if (movieCount) return res.status(400).json({ message: 'Move movies out of this category before removing it.' });
        await category.deleteOne();
        res.json({ message: 'Category removed successfully' });
    } catch (error) {
        next(error);
    }
};
