import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MovieCard from '../components/MovieCard';
import { getMovies, groupMovies } from '../services/movies';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const loadMovies = useCallback(async () => {
        try { setError(''); setMovies(await getMovies()); }
        catch (requestError) { setError(requestError.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { loadMovies(); }, [loadMovies]));
    const collections = useMemo(() => groupMovies(movies), [movies]);

    if (loading || authLoading) return <View style={styles.loading}><Image source={require('../assets/images/logo.png')} style={styles.loadingLogo} contentFit="contain" /><ActivityIndicator size="large" color="#e50914" /></View>;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#050505" />
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.brand}><Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="contain" /><Text style={styles.brandText}>SCREENLY</Text></View>
                <View style={styles.actions}>
                    {user?.role === 'admin' ? <Pressable accessibilityLabel="Open Admin Studio" onPress={() => router.push('/admin')}><Ionicons name="add-circle-outline" size={27} color="#fff" /></Pressable> : null}
                    <Pressable onPress={() => router.push('/search')}><Ionicons name="search" size={25} color="#fff" /></Pressable>
                    <Pressable style={styles.avatar} onPress={() => router.push('/profile')}><Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'G'}</Text></Pressable>
                </View>
            </SafeAreaView>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} tintColor="#e50914" onRefresh={() => { setRefreshing(true); loadMovies(); }} />}>
                {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><Pressable onPress={loadMovies}><Text style={styles.retry}>Try again</Text></Pressable></View> : null}
                {!collections.length ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}><Ionicons name="film-outline" size={42} color="#fff" /></View>
                        <Text style={styles.emptyTitle}>Your Screenly catalog is ready</Text>
                        <Text style={styles.emptyText}>{user?.role === 'admin' ? 'Open Admin Studio and add your first movie.' : 'Movies added by the Screenly administrator will appear here.'}</Text>
                        {user?.role === 'admin' ? <Pressable style={styles.adminButton} onPress={() => router.push('/admin-movie')}><Ionicons name="add" size={20} color="#fff" /><Text style={styles.adminButtonText}>Add Movie</Text></Pressable> : null}
                    </View>
                ) : collections.map((section) => (
                    <View key={section.id} style={styles.section}>
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{section.title}</Text><Ionicons name="chevron-forward" size={19} color="#777" /></View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{section.items.map((movie) => <MovieCard key={`${section.id}-${movie.id}`} movie={movie} />)}</ScrollView>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' }, scroll: { paddingBottom: 90, paddingTop: 8, flexGrow: 1 },
    loading: { flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center', gap: 20 }, loadingLogo: { width: 105, height: 105, borderRadius: 23 },
    header: { minHeight: 66, paddingHorizontal: 16, backgroundColor: '#050505', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#181818' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 36, height: 36, borderRadius: 8 }, brandText: { color: '#e50914', fontSize: 19, fontWeight: '900', letterSpacing: 1.4 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 17 }, avatar: { width: 31, height: 31, borderRadius: 6, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontWeight: '900' },
    errorBox: { margin: 16, padding: 15, borderRadius: 8, backgroundColor: '#251214' }, error: { color: '#ff8d93', fontSize: 13 }, retry: { color: '#fff', fontWeight: '900', marginTop: 10 },
    section: { marginTop: 23 }, sectionHeader: { marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 3 }, sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '900' }, row: { paddingLeft: 16, paddingRight: 6 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, minHeight: 560 }, emptyIcon: { width: 82, height: 82, borderRadius: 20, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 20, textAlign: 'center' }, emptyText: { color: '#999', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 360 }, adminButton: { marginTop: 22, height: 48, borderRadius: 6, paddingHorizontal: 22, backgroundColor: '#e50914', flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, adminButtonText: { color: '#fff', fontWeight: '900' },
});
