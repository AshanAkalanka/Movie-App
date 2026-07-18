import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState([]);
    const [likedMovieIds, setLikedMovieIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const storageKey = user?.id ? `@screenly/watchlist/${user.id}` : null;
    const likesStorageKey = user?.id ? `@screenly/likes/${user.id}` : null;

    useEffect(() => {
        if (!storageKey || !likesStorageKey) {
            setWatchlist([]);
            setLikedMovieIds([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all([AsyncStorage.getItem(storageKey), AsyncStorage.getItem(likesStorageKey)])
            .then(([watchlistValue, likesValue]) => {
                const parsedWatchlist = watchlistValue ? JSON.parse(watchlistValue) : [];
                const parsedLikes = likesValue ? JSON.parse(likesValue) : [];
                setWatchlist(Array.isArray(parsedWatchlist) ? parsedWatchlist.filter((movie) => movie?.id) : []);
                setLikedMovieIds(Array.isArray(parsedLikes) ? [...new Set(parsedLikes.map(String).filter(Boolean))] : []);
            })
            .catch(() => { setWatchlist([]); setLikedMovieIds([]); })
            .finally(() => setLoading(false));
    }, [storageKey, likesStorageKey]);

    const toggleWatchlist = useCallback((movie) => {
        if (!storageKey) return false;
        setWatchlist((current) => {
            const exists = current.some((item) => String(item.id) === String(movie.id));
            const next = exists ? current.filter((item) => String(item.id) !== String(movie.id)) : [{ ...movie, id: String(movie.id) }, ...current];
            AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
            return next;
        });
        return true;
    }, [storageKey]);

    const isSaved = useCallback((id) => watchlist.some((movie) => String(movie.id) === String(id)), [watchlist]);
    const toggleLike = useCallback((id) => {
        if (!likesStorageKey || !id) return false;
        const movieId = String(id);
        setLikedMovieIds((current) => {
            const next = current.includes(movieId) ? current.filter((item) => item !== movieId) : [movieId, ...current];
            AsyncStorage.setItem(likesStorageKey, JSON.stringify(next)).catch(() => {});
            return next;
        });
        return true;
    }, [likesStorageKey]);
    const isLiked = useCallback((id) => likedMovieIds.includes(String(id)), [likedMovieIds]);
    const value = useMemo(() => ({ watchlist, likedMovieIds, loading, toggleWatchlist, isSaved, toggleLike, isLiked }), [watchlist, likedMovieIds, loading, toggleWatchlist, isSaved, toggleLike, isLiked]);
    return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
    const context = useContext(WatchlistContext);
    if (!context) throw new Error('useWatchlist must be used inside WatchlistProvider');
    return context;
}
