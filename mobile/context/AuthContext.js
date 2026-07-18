import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { deleteSessionToken, getSessionToken, setSessionToken } from '../services/secureStorage';

const USER_KEY = '@screenly/user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const [token, storedUser] = await Promise.all([getSessionToken(), AsyncStorage.getItem(USER_KEY)]);
                if (!token || !storedUser) return;
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                try {
                    const response = await api.get('/auth/profile');
                    const freshUser = { ...parsedUser, ...response.data, id: response.data.id || response.data._id || parsedUser.id };
                    setUser(freshUser);
                    await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
                } catch (error) {
                    if ([401, 404].includes(error?.response?.status)) {
                        await Promise.all([deleteSessionToken(), AsyncStorage.removeItem(USER_KEY)]);
                        setUser(null);
                    }
                }
            } catch {
                await Promise.all([deleteSessionToken(), AsyncStorage.removeItem(USER_KEY)]);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = useCallback(async (email, password) => {
        const response = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
        await Promise.all([
            setSessionToken(response.data.token),
            AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user)),
        ]);
        setUser(response.data.user);
        return response.data.user;
    }, []);

    const register = useCallback(async (name, email, password) => {
        await api.post('/auth/register', { name: name.trim(), email: email.trim().toLowerCase(), password });
        return login(email, password);
    }, [login]);

    const logout = useCallback(async () => {
        await Promise.all([deleteSessionToken(), AsyncStorage.removeItem(USER_KEY)]);
        setUser(null);
    }, []);

    const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
}
