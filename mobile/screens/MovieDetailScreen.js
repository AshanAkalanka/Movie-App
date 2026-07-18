import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MovieCard from '../components/MovieCard';
import { getMovie, youtubeWatchUrl } from '../services/movies';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function MovieDetailScreen() {
    const { id } = useLocalSearchParams();
    const movieId = Array.isArray(id) ? id[0] : id;
    const [movie, setMovie] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const { user } = useAuth();
    const { isSaved, toggleWatchlist, isLiked, toggleLike } = useWatchlist();

    const loadMovie = useCallback(async () => {
        if (!movieId) return;
        setLoading(true); setError('');
        try { const result = await getMovie(movieId); setMovie(result.movie); setRelated(result.related); }
        catch (requestError) { setError(requestError.message); setMovie(null); }
        finally { setLoading(false); }
    }, [movieId]);
    useEffect(() => { loadMovie(); }, [loadMovie]);

    const playMovie = () => {
        if (!user) { router.push({ pathname: '/login', params: { returnTo: `/watch/${movie.id}` } }); return; }
        router.push({ pathname: '/watch/[id]', params: { id: String(movie.id) } });
    };
    const saveMovie = () => {
        if (!user) { router.push({ pathname: '/login', params: { returnTo: `/movie/${movie.id}` } }); return; }
        toggleWatchlist(movie);
    };
    const likeMovie = () => {
        if (!user) { router.push({ pathname: '/login', params: { returnTo: `/movie/${movie.id}` } }); return; }
        toggleLike(movie.id);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e50914" /></View>;
    if (!movie) return <ErrorState message={error} onBack={() => router.back()} onRetry={loadMovie} />;
    const saved = isSaved(movie.id);
    const liked = isLiked(movie.id);
    const watchUrl = youtubeWatchUrl(movie.youtubeVideoId);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.backdropWrap}>
                    <Image source={movie.backdropUrl || movie.posterUrl} style={styles.backdrop} contentFit="cover" transition={220} />
                    <View pointerEvents="none" style={styles.backdropTint} />
                    <View pointerEvents="none" style={[styles.backdropFade, styles.backdropFadeWide]} />
                    <View pointerEvents="none" style={[styles.backdropFade, styles.backdropFadeMiddle]} />
                    <View pointerEvents="none" style={[styles.backdropFade, styles.backdropFadeBottom]} />
                    <SafeAreaView edges={['top']} style={styles.topBar}>
                        <Pressable style={styles.circleButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#fff" /></Pressable>
                        <View style={styles.topActions}>{user?.role === 'admin' ? <Pressable style={styles.circleButton} onPress={() => router.push({ pathname: '/admin-movie', params: { id: String(movie.id) } })}><Ionicons name="create-outline" size={21} color="#fff" /></Pressable> : null}<Pressable style={styles.circleButton} onPress={() => Share.share({ message: `${movie.title}\n${watchUrl}`, url: watchUrl })}><Ionicons name="share-outline" size={22} color="#fff" /></Pressable></View>
                    </SafeAreaView>
                    <Pressable style={styles.bigPlay} onPress={playMovie}><Ionicons name={user ? 'play' : 'lock-closed'} size={34} color="#000" /></Pressable>
                </View>

                <View style={styles.body}>
                    <Text style={styles.title}>{movie.title}</Text>
                    <View style={styles.metaRow}><Text style={styles.available}>{movie.playCount ? `${movie.playCount.toLocaleString()} plays` : 'Now on Screenly'}</Text>{movie.releaseYear ? <Text style={styles.meta}>{movie.releaseYear}</Text> : null}<Text style={styles.rating}>{movie.maturityRating || 'NR'}</Text>{movie.duration ? <Text style={styles.meta}>{movie.duration}</Text> : null}<Text style={styles.quality}>TRAILER</Text></View>
                    <View style={styles.genreRow}>{[movie.category, ...(movie.genres || [])].filter(Boolean).map((genre) => <Text key={genre} style={styles.genre}>{genre}</Text>)}</View>
                    <Pressable style={styles.playButton} onPress={playMovie}><Ionicons name={user ? 'play' : 'lock-closed'} size={21} color="#000" /><Text style={styles.playText}>{user ? 'Play Full Screen' : 'Sign in to Play'}</Text></Pressable>
                    <Text style={styles.description}>{movie.description}</Text>
                    {movie.actors?.length ? <Text style={styles.credit}><Text style={styles.creditLabel}>Cast: </Text>{movie.actors.join(', ')}</Text> : null}
                    {movie.director ? <Text style={styles.credit}><Text style={styles.creditLabel}>Director: </Text>{movie.director}</Text> : null}
                    {movie.language ? <Text style={styles.credit}><Text style={styles.creditLabel}>Language: </Text>{movie.language}</Text> : null}
                    <View style={styles.actions}>{user?.role !== 'admin' ? <><Pressable accessibilityLabel={saved ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`} style={styles.action} onPress={saveMovie}><Ionicons name={saved ? 'checkmark' : 'add'} size={29} color="#fff" /><Text style={styles.actionText}>{saved ? 'In My List' : 'My List'}</Text></Pressable><Pressable accessibilityLabel={liked ? `Unlike ${movie.title}` : `Like ${movie.title}`} style={styles.action} onPress={likeMovie}><Ionicons name={liked ? 'thumbs-up' : 'thumbs-up-outline'} size={25} color={liked ? '#ff4e58' : '#fff'} /><Text style={[styles.actionText, liked && styles.actionTextActive]}>{liked ? 'Liked' : 'Like'}</Text></Pressable></> : null}<Pressable style={styles.action} onPress={() => Share.share({ message: `${movie.title}\n${watchUrl}`, url: watchUrl })}><Ionicons name="paper-plane-outline" size={25} color="#fff" /><Text style={styles.actionText}>Share</Text></Pressable></View>
                </View>
                {related.length ? <View style={styles.section}><View style={styles.redLine} /><Text style={styles.sectionTitle}>More Like This</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.movieRow}>{related.map((item) => <MovieCard key={item.id} movie={item} compact />)}</ScrollView></View> : null}
            </ScrollView>
        </View>
    );
}

function ErrorState({ message, onBack, onRetry }) {
    return <SafeAreaView style={styles.center}><Ionicons name="alert-circle-outline" size={48} color="#777" /><Text style={styles.errorTitle}>Movie unavailable</Text><Text style={styles.errorText}>{message}</Text><View style={styles.errorActions}><Pressable style={styles.darkAction} onPress={onBack}><Text style={styles.darkActionText}>Go Back</Text></Pressable><Pressable style={styles.lightAction} onPress={onRetry}><Text style={styles.lightActionText}>Retry</Text></Pressable></View></SafeAreaView>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' }, center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 28 }, scroll: { paddingBottom: 38 },
    backdropWrap: { height: 390, backgroundColor: '#141414' }, backdrop: { ...StyleSheet.absoluteFillObject }, backdropTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.06)' }, backdropFade: { position: 'absolute', left: 0, right: 0, bottom: 0 }, backdropFadeWide: { height: 160, backgroundColor: 'rgba(0,0,0,0.10)' }, backdropFadeMiddle: { height: 95, backgroundColor: 'rgba(0,0,0,0.18)' }, backdropFadeBottom: { height: 42, backgroundColor: 'rgba(0,0,0,0.58)' },
    topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between' }, topActions: { flexDirection: 'row', gap: 10 }, circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center' },
    bigPlay: { position: 'absolute', left: '50%', top: '50%', marginLeft: -31, marginTop: -31, width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },
    body: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6, backgroundColor: '#000' }, title: { color: '#fff', fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.5 }, metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 10 }, available: { color: '#46d369', fontSize: 11, fontWeight: '900' }, meta: { color: '#bbb', fontSize: 12, fontWeight: '600' }, rating: { color: '#aaa', fontSize: 9, fontWeight: '900', borderWidth: 1, borderColor: '#666', paddingHorizontal: 5, paddingVertical: 2 }, quality: { color: '#ddd', fontSize: 8, fontWeight: '900', letterSpacing: 0.5, borderWidth: 1, borderColor: '#777', borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },
    genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 }, genre: { color: '#ddd', fontSize: 11, backgroundColor: '#202020', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
    playButton: { height: 49, borderRadius: 5, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 19 }, playText: { color: '#000', fontSize: 15, fontWeight: '900' },
    description: { color: '#e2e2e2', fontSize: 14, lineHeight: 21, marginTop: 18 }, credit: { color: '#ddd', fontSize: 12, lineHeight: 18, marginTop: 8 }, creditLabel: { color: '#777' },
    actions: { flexDirection: 'row', gap: 22, marginTop: 22 }, action: { alignItems: 'center', minWidth: 68, gap: 5 }, actionText: { color: '#aaa', fontSize: 11, fontWeight: '700' }, actionTextActive: { color: '#ff6c74', fontWeight: '900' },
    section: { marginTop: 30 }, redLine: { height: 3, backgroundColor: '#e50914', width: 125, marginLeft: 16, marginBottom: 14 }, sectionTitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginHorizontal: 16, marginBottom: 14 }, movieRow: { paddingLeft: 16 },
    errorTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 14 }, errorText: { color: '#999', textAlign: 'center', marginTop: 8 }, errorActions: { flexDirection: 'row', gap: 10, marginTop: 20 }, darkAction: { borderWidth: 1, borderColor: '#555', borderRadius: 5, paddingHorizontal: 20, paddingVertical: 12 }, darkActionText: { color: '#fff', fontWeight: '900' }, lightAction: { backgroundColor: '#fff', borderRadius: 5, paddingHorizontal: 20, paddingVertical: 12 }, lightActionText: { color: '#000', fontWeight: '900' },
});
