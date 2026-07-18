// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { WatchlistProvider } from '../context/WatchlistContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <WatchlistProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="movie/[id]" />
                    <Stack.Screen name="watch/[id]" options={{ gestureEnabled: false }} />
                    <Stack.Screen name="admin-movie" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="account-settings" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="login" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="register" options={{ presentation: 'modal' }} />
                </Stack>
            </WatchlistProvider>
        </AuthProvider>
    );
}
