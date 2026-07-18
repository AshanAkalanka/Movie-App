const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const WatchEvent = require('../models/WatchEvent');
const { removeUploadedFile } = require('../middleware/uploadMiddleware');

const MAX_LIST_ITEMS = 250;

function cleanList(value, maxItems = 30) {
    const items = Array.isArray(value) ? value : String(value || '').split(',');
    return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))].slice(0, maxItems);
}

function youtubeVideoId(value) {
    const input = String(value || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
    try {
        const url = new URL(input);
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        let id = '';
        if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
        if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
            id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] || '';
        }
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
    } catch {
        return '';
    }
}

function validHttpUrl(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

function validImageLocation(value) {
    return /^\/uploads\/[A-Za-z0-9-]+\.(?:jpg|png|webp)$/.test(value) || validHttpUrl(value);
}

function moviePayload(body) {
    const releaseYear = Number.parseInt(body.releaseYear, 10);
    const sortOrder = Number.parseInt(body.sortOrder, 10);
    return {
        title: String(body.title || '').trim(),
        description: String(body.description || '').trim(),
        category: String(body.category || '').trim(),
        genres: cleanList(body.genres),
        posterUrl: String(body.posterUrl || '').trim(),
        backdropUrl: String(body.backdropUrl || '').trim(),
        youtubeVideoId: youtubeVideoId(body.youtubeUrl || body.youtubeVideoId),
        actors: cleanList(body.actors),
        director: String(body.director || '').trim(),
        releaseYear: Number.isInteger(releaseYear) ? releaseYear : undefined,
        duration: String(body.duration || '').trim(),
        maturityRating: String(body.maturityRating || 'PG').trim(),
        language: String(body.language || 'English').trim(),
        featured: body.featured === true,
        published: body.published !== false,
        sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
    };
}

function validateMovie(payload) {
    if (!payload.title || !payload.description || !payload.category || !payload.posterUrl || !payload.youtubeVideoId) {
        return 'Add a title, description, category, poster image, and valid YouTube link.';
    }
    if (!validImageLocation(payload.posterUrl) || (payload.backdropUrl && !validImageLocation(payload.backdropUrl))) {
        return 'Choose valid poster and backdrop images.';
    }
    if (payload.releaseYear && (payload.releaseYear < 1888 || payload.releaseYear > 2100)) {
        return 'Release year is not valid';
    }
    return '';
}

function publicMediaUrl(value, req) {
    if (!String(value || '').startsWith('/uploads/')) return value;
    return `${req.protocol}://${req.get('host')}${value}`;
}

function publicMovie(movie, req) {
    const value = movie.toObject ? movie.toObject() : movie;
    const { _id, createdBy, ...safeValue } = value;
    return {
        ...safeValue,
        id: String(_id),
        posterPath: value.posterUrl,
        backdropPath: value.backdropUrl,
        posterUrl: publicMediaUrl(value.posterUrl, req),
        backdropUrl: publicMediaUrl(value.backdropUrl, req),
        youtubeUrl: `https://www.youtube-nocookie.com/embed/${value.youtubeVideoId}`,
    };
}

exports.listMovies = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const filter = isAdmin && req.query.includeUnpublished === 'true' ? {} : { published: true };
        const category = String(req.query.category || '').trim();
        const search = String(req.query.search || '').trim();
        if (category) filter.category = category;
        if (search) filter.$text = mongoose.trusted({ $search: search.slice(0, 100) });

        const movies = await Movie.find(filter)
            .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
            .limit(MAX_LIST_ITEMS)
            .lean();
        res.json({ movies: movies.map((movie) => publicMovie(movie, req)) });
    } catch (error) {
        next(error);
    }
};

exports.getMovie = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Movie not found' });
        const movie = await Movie.findById(req.params.id).lean();
        if (!movie || (!movie.published && req.user?.role !== 'admin')) return res.status(404).json({ message: 'Movie not found' });
        const related = await Movie.find({ _id: mongoose.trusted({ $ne: movie._id }), published: true, category: movie.category })
            .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
            .limit(12)
            .lean();
        res.json({ movie: publicMovie(movie, req), related: related.map((item) => publicMovie(item, req)) });
    } catch (error) {
        next(error);
    }
};

exports.createMovie = async (req, res, next) => {
    try {
        const payload = moviePayload(req.body);
        const validationError = validateMovie(payload);
        if (validationError) return res.status(400).json({ message: validationError });
        const movie = await Movie.create({ ...payload, createdBy: req.user.id });
        res.status(201).json({ movie: publicMovie(movie, req) });
    } catch (error) {
        next(error);
    }
};

exports.updateMovie = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Movie not found' });
        const payload = moviePayload(req.body);
        const validationError = validateMovie(payload);
        if (validationError) return res.status(400).json({ message: validationError });
        const previous = await Movie.findById(req.params.id).lean();
        if (!previous) return res.status(404).json({ message: 'Movie not found' });
        const movie = await Movie.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        const replacedImages = [
            previous.posterUrl !== payload.posterUrl ? previous.posterUrl : '',
            previous.backdropUrl !== payload.backdropUrl ? previous.backdropUrl : '',
        ];
        await Promise.allSettled(replacedImages.filter(Boolean).map(removeUploadedFile));
        res.json({ movie: publicMovie(movie, req) });
    } catch (error) {
        next(error);
    }
};

exports.deleteMovie = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Movie not found' });
        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        await WatchEvent.deleteMany({ movie: movie._id });
        await Promise.allSettled([movie.posterUrl, movie.backdropUrl].filter(Boolean).map(removeUploadedFile));
        res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.recordPlay = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Movie not found' });
        const movie = await Movie.findOneAndUpdate(
            { _id: req.params.id, published: true },
            { $inc: { playCount: 1 } },
            { new: true }
        );
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        await WatchEvent.create({ user: req.user.id, movie: movie._id });
        res.status(201).json({ playCount: movie.playCount });
    } catch (error) {
        next(error);
    }
};
