const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// Middleware
const allowedOrigins = String(process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const developmentOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
]);

app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || (!isProduction && developmentOrigins.has(origin))) {
            return callback(null, true);
        }
        const error = new Error('Origin not allowed');
        error.status = 403;
        return callback(error);
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb', parameterLimit: 50 }));
app.use('/uploads', (req, res, next) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.resolve(__dirname, 'uploads'), {
    dotfiles: 'deny',
    fallthrough: true,
    immutable: true,
    index: false,
    maxAge: '7d',
}));
app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' },
}));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Screenly authentication API is running' });
});
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
    if (!isProduction) console.error(err.stack);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            throw new Error('JWT_SECRET must contain at least 32 characters');
        }
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB Connected');
        await require('./utils/ensureAdmin')();
        await require('./utils/ensureCategories')();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
}

if (require.main === module) startServer();

module.exports = { app, startServer };
