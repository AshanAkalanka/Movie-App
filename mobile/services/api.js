import { create } from 'axios';
import { Platform } from 'react-native';
import { getSessionToken } from './secureStorage';

const defaultBaseUrl = Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
const androidBaseUrl = configuredBaseUrl?.replace(
    /^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/i,
    (_, protocol) => `${protocol}10.0.2.2`,
);

export const apiBaseUrl = Platform.OS === 'android'
    ? androidBaseUrl || defaultBaseUrl
    : configuredBaseUrl || defaultBaseUrl;

export const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/i, '');
export const resolveMediaUrl = (value) => String(value || '').startsWith('/') ? `${serverBaseUrl}${value}` : value;

const api = create({
    baseURL: apiBaseUrl,
    timeout: 12000,
});

api.interceptors.request.use(async (config) => {
    const token = await getSessionToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
