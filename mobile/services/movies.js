import api from './api';

const movieCache = new Map();

function remember(movie) {
    if (movie?.id) movieCache.set(String(movie.id), movie);
    return movie;
}

function friendlyError(error, fallback) {
    const requestError = new Error(error?.response?.data?.message || fallback);
    requestError.status = error?.response?.status;
    return requestError;
}

export async function getMovies({ search = '', includeUnpublished = false } = {}) {
    try {
        const response = await api.get('/movies', { params: { search: search.trim() || undefined, includeUnpublished: includeUnpublished || undefined } });
        return (response.data.movies || []).map(remember);
    } catch (error) {
        throw friendlyError(error, 'Screenly is taking a little longer than expected. Pull down to try again.');
    }
}

export async function getMovie(id) {
    try {
        const response = await api.get(`/movies/${encodeURIComponent(id)}`);
        return { movie: remember(response.data.movie), related: (response.data.related || []).map(remember) };
    } catch (error) {
        throw friendlyError(error, 'This movie isn’t available right now.');
    }
}

export async function createMovie(payload) {
    try {
        const response = await api.post('/movies', payload);
        return remember(response.data.movie);
    } catch (error) {
        throw friendlyError(error, 'This movie wasn’t added. Review the details and try again.');
    }
}

export async function updateMovie(id, payload) {
    try {
        const response = await api.put(`/movies/${encodeURIComponent(id)}`, payload);
        return remember(response.data.movie);
    } catch (error) {
        throw friendlyError(error, 'Your changes weren’t saved. Please try again.');
    }
}

export async function deleteMovie(id) {
    try {
        await api.delete(`/movies/${encodeURIComponent(id)}`);
        movieCache.delete(String(id));
    } catch (error) {
        throw friendlyError(error, 'This movie couldn’t be removed right now.');
    }
}

export async function recordMoviePlay(id) {
    try { await api.post(`/movies/${encodeURIComponent(id)}/play`); }
    catch { /* Playback should continue even when analytics are temporarily unavailable. */ }
}

export function groupMovies(movies) {
    const sections = [];
    const featured = movies.filter((movie) => movie.featured);
    if (featured.length) sections.push({ id: 'featured', title: 'Featured', items: featured });
    const categories = new Map();
    movies.forEach((movie) => {
        const name = movie.category || 'More to Watch';
        if (!categories.has(name)) categories.set(name, []);
        categories.get(name).push(movie);
    });
    categories.forEach((items, title) => sections.push({ id: `category-${title}`, title, items }));
    return sections;
}

export const youtubeWatchUrl = (videoId) => `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
