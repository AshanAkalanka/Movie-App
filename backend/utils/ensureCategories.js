const Category = require('../models/Category');
const Movie = require('../models/Movie');

const DEFAULT_CATEGORIES = [
    'Trending Now',
    'Action',
    'Drama',
    'Comedy',
    'Thriller',
    'Horror',
    'Sci-Fi',
    'Romance',
    'Documentary',
    'Family',
];

module.exports = async function ensureCategories() {
    await Promise.all(DEFAULT_CATEGORIES.map((name, index) => Category.updateOne(
        { name },
        { $set: { protected: true, sortOrder: index * 10 } },
        { upsert: true }
    )));

    const existingMovieCategories = (await Movie.distinct('category')).map((name) => String(name || '').trim()).filter(Boolean);
    await Promise.all(existingMovieCategories.map((name) => Category.updateOne(
        { name },
        { $setOnInsert: { protected: DEFAULT_CATEGORIES.includes(name), sortOrder: DEFAULT_CATEGORIES.indexOf(name) >= 0 ? DEFAULT_CATEGORIES.indexOf(name) * 10 : 100 } },
        { upsert: true }
    )));
};

module.exports.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
