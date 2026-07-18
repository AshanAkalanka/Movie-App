const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');
const multer = require('multer');
const { uploadImage } = require('../middleware/uploadMiddleware');
const { getStats, listUsers, updateUser, deleteUser, uploadImage: saveUploadedImage, deleteImage } = require('../controllers/adminController');

router.use(auth, adminOnly);
router.get('/stats', getStats);
router.get('/users', listUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/uploads/image', (req, res, next) => {
    uploadImage.single('image')(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) {
            const message = error.friendlyMessage || (error.code === 'LIMIT_FILE_SIZE' ? 'Choose an image smaller than 8 MB.' : 'We couldn’t upload that image.');
            return res.status(400).json({ message });
        }
        next(error);
    });
}, saveUploadedImage);
router.delete('/uploads/image', deleteImage);

module.exports = router;
