import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TrailerPlayer from '../components/TrailerPlayer';
import { getMovie, recordMoviePlay } from '../services/movies';
import { useAuth } from '../context/AuthContext';

export default function PlayerScreen() {
    const { id } = useLocalSearchParams();
    const movieId = Array.isArray(id) ? id[0] : id;
    const [movie, setMovie] = useState(null);
    const [error, setError] = useState('');
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const load = useCallback(async () => {
        try { const result = await getMovie(movieId); setMovie(result.movie); recordMoviePlay(movieId); }
        catch (requestError) { setError(requestError.message); }
    }, [movieId]);
    useEffect(() => { if (!authLoading && user) load(); }, [authLoading, user, load]);
    useEffect(() => { if (!authLoading && !user) router.replace({ pathname: '/login', params: { returnTo: `/watch/${movieId}` } }); }, [authLoading, user, movieId, router]);
    useEffect(() => {
        if (Platform.OS === 'web') return undefined;
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
        return () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {}); };
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            {movie ? <TrailerPlayer videoId={movie.youtubeVideoId} fullscreen onError={() => setError('This video isn’t available right now. Please try another movie.')} /> : !error ? <ActivityIndicator size="large" color="#e50914" /> : null}
            <Pressable accessibilityLabel="Close player" style={styles.close} onPress={() => router.back()}><Ionicons name="close" size={28} color="#fff" /></Pressable>
            {error ? <View style={styles.errorWrap}><Ionicons name="alert-circle-outline" size={42} color="#999" /><Text style={styles.error}>{error}</Text><Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>Go Back</Text></Pressable></View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }, close: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center' }, errorWrap: { position: 'absolute', alignItems: 'center', padding: 30 }, error: { color: '#ddd', marginTop: 12, textAlign: 'center' }, back: { backgroundColor: '#fff', borderRadius: 5, paddingHorizontal: 22, paddingVertical: 12, marginTop: 18 }, backText: { color: '#000', fontWeight: '900' },
});
