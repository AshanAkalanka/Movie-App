// routes/authRoutes.js
const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const auth = require('../middleware/authMiddleware');
const { register, login, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const isProduction = process.env.NODE_ENV === 'production';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: 'Too many authentication attempts. Try again later.' },
});

const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: isProduction ? 5 : 50,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many accounts created from this network. Try again later.' },
});

router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', loginLimiter, auth, changePassword);

module.exports = router;
