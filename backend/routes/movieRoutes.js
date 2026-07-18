const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');
const { listMovies, getMovie, createMovie, updateMovie, deleteMovie, recordPlay } = require('../controllers/movieController');

function optionalAuth(req, res, next) {
    if (!req.header('Authorization')) return next();
    return auth(req, res, next);
}

router.get('/', optionalAuth, listMovies);
router.get('/:id', optionalAuth, getMovie);
router.post('/:id/play', auth, recordPlay);
router.post('/', auth, adminOnly, createMovie);
router.put('/:id', auth, adminOnly, updateMovie);
router.delete('/:id', auth, adminOnly, deleteMovie);

module.exports = router;
