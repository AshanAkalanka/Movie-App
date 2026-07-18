const bcrypt = require('bcryptjs');
const User = require('../models/User');

const BCRYPT_ROUNDS = 12;

module.exports = async function ensureAdmin() {
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || '');
    if (!email || !password) {
        console.warn('Admin account not configured; set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env');
        return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 72) {
        throw new Error('ADMIN_EMAIL must be valid and ADMIN_PASSWORD must contain 8 to 72 characters');
    }

    let user = await User.findOne({ email }).select('+password');
    if (!user) {
        user = new User({
            name: 'Screenly Admin',
            email,
            password: await bcrypt.hash(password, BCRYPT_ROUNDS),
            role: 'admin',
        });
        await user.save();
        console.log('Screenly admin account created');
        return;
    }

    let changed = false;
    if (user.role !== 'admin') {
        user.role = 'admin';
        changed = true;
    }
    if (!(await bcrypt.compare(password, user.password))) {
        user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
        user.tokenVersion += 1;
        changed = true;
    }
    if (changed) {
        await user.save();
        console.log('Screenly admin account updated');
    }
};
