const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDirectory = path.resolve(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadsDirectory,
    filename(req, file, callback) {
        callback(null, `${crypto.randomUUID()}.upload`);
    },
});

const uploadImage = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 5 },
    fileFilter(req, file, callback) {
        const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
        if (!allowed.has(String(file.mimetype || '').toLowerCase())) {
            const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
            error.friendlyMessage = 'Choose a JPG, PNG, or WebP image.';
            return callback(error);
        }
        callback(null, true);
    },
});

async function detectImageExtension(filePath) {
    const handle = await fs.promises.open(filePath, 'r');
    try {
        const header = Buffer.alloc(12);
        await handle.read(header, 0, header.length, 0);
        if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'jpg';
        if (header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
        if (header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
        return '';
    } finally {
        await handle.close();
    }
}

function localUploadPath(value) {
    const input = String(value || '');
    if (!/^\/uploads\/[A-Za-z0-9-]+\.(?:jpg|png|webp)$/.test(input)) return '';
    const filename = path.basename(input);
    const resolved = path.resolve(uploadsDirectory, filename);
    return resolved.startsWith(`${uploadsDirectory}${path.sep}`) ? resolved : '';
}

async function removeUploadedFile(value) {
    const filePath = localUploadPath(value);
    if (!filePath) return false;
    try { await fs.promises.unlink(filePath); return true; }
    catch (error) { if (error.code !== 'ENOENT') throw error; return false; }
}

module.exports = { uploadImage, uploadsDirectory, detectImageExtension, removeUploadedFile };
