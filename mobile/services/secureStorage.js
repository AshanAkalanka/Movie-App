import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SECURE_TOKEN_KEY = 'screenly.token';
const LEGACY_TOKEN_KEY = '@screenly/token';

const webStorage = () => typeof globalThis.sessionStorage === 'undefined' ? null : globalThis.sessionStorage;

export async function getSessionToken() {
    const token = Platform.OS === 'web'
        ? webStorage()?.getItem(SECURE_TOKEN_KEY) || null
        : await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
    if (token) return token;

    const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (!legacyToken) return null;
    await setSessionToken(legacyToken);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacyToken;
}

export async function setSessionToken(token) {
    if (Platform.OS === 'web') {
        webStorage()?.setItem(SECURE_TOKEN_KEY, token);
        return;
    }
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
}

export async function deleteSessionToken() {
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    if (Platform.OS === 'web') {
        webStorage()?.removeItem(SECURE_TOKEN_KEY);
        return;
    }
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
}
