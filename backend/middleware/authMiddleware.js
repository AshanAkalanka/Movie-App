// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required' });
    const token = authHeader.slice(7).trim();
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: 'screenly-api',
            audience: 'screenly-mobile',
        });
        const user = await User.findById(decoded.sub).select('role tokenVersion suspended');
        if (!user || user.suspended || user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({ message: 'Session is no longer valid' });
        }
        req.user = { id: String(user._id), role: user.role };
        next();
    } catch {
        res.status(401).json({ message: 'Session is not valid' });
    }
};
