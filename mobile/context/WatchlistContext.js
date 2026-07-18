import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(false);
    const storageKey = user?.id ? `@screenly/watchlist/${user.id}` : null;

    useEffect(() => {
        if (!storageKey) {
            setWatchlist([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        AsyncStorage.getItem(storageKey)
            .then((value) => {
                const parsed = value ? JSON.parse(value) : [];
                setWatchlist(Array.isArray(parsed) ? parsed.filter((movie) => movie?.id) : []);
            })
            .catch(() => setWatchlist([]))
            .finally(() => setLoading(false));
    }, [storageKey]);

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
    const value = useMemo(() => ({ watchlist, loading, toggleWatchlist, isSaved }), [watchlist, loading, toggleWatchlist, isSaved]);
    return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
    const context = useContext(WatchlistContext);
    if (!context) throw new Error('useWatchlist must be used inside WatchlistProvider');
    return context;
}
