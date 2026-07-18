import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMovies } from '../services/movies';

const CATEGORY_COLORS = ['#5420b7', '#9b1c31', '#145a67', '#76500e', '#244d2e', '#733160'];

function categoryIcon(name) {
    const value = String(name || '').toLowerCase();
    if (value.includes('action')) return 'flash-outline';
    if (value.includes('comedy')) return 'happy-outline';
    if (value.includes('horror') || value.includes('thriller')) return 'skull-outline';
    if (value.includes('romance')) return 'heart-outline';
    if (value.includes('sci')) return 'planet-outline';
    if (value.includes('document')) return 'videocam-outline';
    if (value.includes('family')) return 'people-outline';
    if (value.includes('drama')) return 'rose-outline';
    return 'film-outline';
}

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [movies, setMovies] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const { width } = useWindowDimensions();
    const { category: requestedCategory } = useLocalSearchParams();
    const router = useRouter();

    const loadMovies = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        setError('');
        try { setMovies(await getMovies()); }
        catch (requestError) { setError(requestError.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { loadMovies(); }, [loadMovies]));

    const categories = useMemo(() => {
        const counts = new Map();
        movies.forEach((movie) => {
            const name = movie.category || 'More to Watch';
            counts.set(name, (counts.get(name) || 0) + 1);
        });
        const featuredCount = movies.filter((movie) => movie.featured).length;
        return [{ name: 'All', count: movies.length }, ...(featuredCount ? [{ name: 'Featured', count: featuredCount }] : []), ...Array.from(counts, ([name, count]) => ({ name, count })).filter((category) => category.name !== 'Featured')];
    }, [movies]);

    useEffect(() => {
        if (!categories.some((category) => category.name === selectedCategory)) setSelectedCategory('All');
    }, [categories, selectedCategory]);

    useEffect(() => {
        const value = Array.isArray(requestedCategory) ? requestedCategory[0] : requestedCategory;
        if (value && categories.some((category) => category.name === value)) setSelectedCategory(value);
    }, [categories, requestedCategory]);

    const results = useMemo(() => {
        const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        return movies.filter((movie) => {
            if (selectedCategory === 'Featured' && !movie.featured) return false;
            if (selectedCategory !== 'All' && selectedCategory !== 'Featured' && movie.category !== selectedCategory) return false;
            if (!words.length) return true;
            const searchable = [movie.title, movie.description, movie.category, movie.director, movie.language, ...(movie.genres || []), ...(movie.actors || [])]
                .filter(Boolean).join(' ').toLowerCase();
            return words.every((word) => searchable.includes(word));
        });
    }, [movies, query, selectedCategory]);

    const columns = width >= 900 ? 5 : width >= 650 ? 4 : width >= 430 ? 3 : 2;
    const contentWidth = Math.min(width, 1000);
    const cardWidth = Math.floor((contentWidth - 32 - (columns - 1) * 12) / columns);
    const hasFilters = Boolean(query.trim()) || selectedCategory !== 'All';
    const resetFilters = () => { setQuery(''); setSelectedCategory('All'); };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#08080a" />
            <View style={styles.pageHeader}>
                <View style={styles.eyebrowRow}><View style={styles.eyebrowLine} /><Text style={styles.eyebrow}>DISCOVER SCREENLY</Text></View>
                <Text style={styles.title}>Find your next story</Text>
                <Text style={styles.subtitle}>Search movies, actors, directors, genres, and categories.</Text>
                <View style={styles.searchBox}>
                    <View style={styles.searchIcon}><Ionicons name="search" size={20} color="#fff" /></View>
                    <TextInput value={query} onChangeText={setQuery} placeholder="What do you want to watch?" placeholderTextColor="#777981" style={styles.input} autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
                    {query ? <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}><Ionicons name="close-circle" size={21} color="#8c8e96" /></Pressable> : null}
                </View>
            </View>

            {!loading ? <View style={styles.categorySection}>
                <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Browse categories</Text><Text style={styles.sectionHint}>Swipe to explore</Text></View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow} keyboardShouldPersistTaps="handled">
                    {categories.map((category, index) => {
                        const active = category.name === selectedCategory;
                        return <Pressable key={category.name} style={[styles.categoryCard, { backgroundColor: category.name === 'All' ? '#25262d' : CATEGORY_COLORS[(index - 1) % CATEGORY_COLORS.length] }, active && styles.categoryCardActive]} onPress={() => setSelectedCategory(category.name)}>
                            <View style={[styles.categoryIcon, active && styles.categoryIconActive]}><Ionicons name={category.name === 'All' ? 'apps' : category.name === 'Featured' ? 'flame-outline' : categoryIcon(category.name)} size={19} color="#fff" /></View>
                            <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
                            <Text style={styles.categoryCount}>{category.count} movie{category.count === 1 ? '' : 's'}</Text>
                            {active ? <View style={styles.selectedMark}><Ionicons name="checkmark" size={11} color="#fff" /></View> : null}
                        </Pressable>;
                    })}
                </ScrollView>
            </View> : null}

            <View style={styles.resultsHeader}>
                <View><Text style={styles.resultsTitle}>{query.trim() ? 'Search results' : selectedCategory === 'All' ? 'Explore movies' : selectedCategory}</Text><Text style={styles.resultsCount}>{results.length} title{results.length === 1 ? '' : 's'} found</Text></View>
                {hasFilters ? <Pressable style={styles.resetButton} onPress={resetFilters}><Ionicons name="refresh" size={14} color="#d5d5db" /><Text style={styles.resetText}>Reset</Text></Pressable> : null}
            </View>

            {error ? <View style={styles.errorBox}><View style={styles.errorIcon}><Ionicons name="cloud-offline-outline" size={21} color="#ff858c" /></View><View style={styles.errorCopy}><Text style={styles.errorTitle}>Movies couldn’t be loaded</Text><Text style={styles.errorText}>{error}</Text></View><Pressable style={styles.retry} onPress={() => loadMovies()}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

            {loading ? <View style={styles.loading}><ActivityIndicator size="large" color="#e50914" /><Text style={styles.loadingText}>Finding great movies…</Text></View> : <FlatList
                key={columns}
                data={results}
                keyExtractor={(item) => String(item.id)}
                numColumns={columns}
                columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
                contentContainerStyle={[styles.grid, !results.length && styles.gridEmpty]}
                refreshControl={<RefreshControl refreshing={refreshing} tintColor="#e50914" onRefresh={() => loadMovies(true)} />}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                renderItem={({ item }) => <SearchMovieCard movie={item} width={cardWidth} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(item.id) } })} />}
                ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="search-outline" size={36} color="#a0a1aa" /></View><Text style={styles.emptyTitle}>No movies found</Text><Text style={styles.emptyText}>Try a different title, person, genre, or category.</Text>{hasFilters ? <Pressable style={styles.emptyButton} onPress={resetFilters}><Text style={styles.emptyButtonText}>Show all movies</Text></Pressable> : null}</View>}
                showsVerticalScrollIndicator={false}
            />}
        </SafeAreaView>
    );
}

function SearchMovieCard({ movie, width, onPress }) {
    return <Pressable accessibilityRole="button" accessibilityLabel={`View ${movie.title}`} style={({ pressed }) => [styles.movieCard, { width }, pressed && styles.pressed]} onPress={onPress}>
        <View style={styles.posterWrap}>
            {movie.posterUrl ? <Image source={movie.posterUrl} style={styles.poster} contentFit="cover" transition={180} /> : <View style={styles.posterFallback}><Ionicons name="film-outline" size={34} color="#e50914" /></View>}
            <View style={styles.posterShade} />
            {movie.featured ? <View style={styles.featuredBadge}><Ionicons name="sparkles" size={9} color="#fff" /><Text style={styles.featuredText}>FEATURED</Text></View> : null}
            <View style={styles.cardPlay}><Ionicons name="play" size={15} color="#050505" /></View>
        </View>
        <Text style={styles.movieTitle} numberOfLines={1}>{movie.title}</Text>
        <Text style={styles.movieMeta} numberOfLines={1}>{movie.releaseYear || 'New'}  •  {movie.category || 'Movie'}</Text>
    </Pressable>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08080a' },
    pageHeader: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 9 }, eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, eyebrowLine: { width: 22, height: 3, borderRadius: 2, backgroundColor: '#e50914' }, eyebrow: { color: '#ff4d57', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 }, title: { color: '#fff', fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginTop: 8 }, subtitle: { color: '#80818a', fontSize: 12, lineHeight: 17, marginTop: 5 },
    searchBox: { height: 54, borderRadius: 14, backgroundColor: '#17181d', borderWidth: 1, borderColor: '#2d2f37', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 10, marginTop: 18 }, searchIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, input: { flex: 1, color: '#fff', fontSize: 14, height: '100%' },
    categorySection: { marginTop: 20 }, sectionHeading: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: '#f4f4f5', fontSize: 15, fontWeight: '900' }, sectionHint: { color: '#65666e', fontSize: 9 }, categoryRow: { paddingHorizontal: 16, gap: 9 }, categoryCard: { width: 121, height: 82, borderRadius: 13, padding: 11, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }, categoryCardActive: { borderColor: '#fff', borderWidth: 2, padding: 10 }, categoryIcon: { width: 29, height: 29, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.24)', alignItems: 'center', justifyContent: 'center' }, categoryIconActive: { backgroundColor: 'rgba(255,255,255,0.2)' }, categoryName: { color: '#fff', fontSize: 11, fontWeight: '900', marginTop: 6, paddingRight: 12 }, categoryCount: { color: 'rgba(255,255,255,0.67)', fontSize: 8, marginTop: 2 }, selectedMark: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
    resultsHeader: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 16, marginTop: 21, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, resultsTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, resultsCount: { color: '#696a73', fontSize: 9, marginTop: 3 }, resetButton: { height: 31, borderRadius: 9, backgroundColor: '#202127', borderWidth: 1, borderColor: '#30313a', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }, resetText: { color: '#d5d5db', fontSize: 9, fontWeight: '800' },
    errorBox: { marginHorizontal: 16, marginBottom: 11, padding: 12, borderRadius: 12, backgroundColor: '#241316', borderWidth: 1, borderColor: '#432026', flexDirection: 'row', alignItems: 'center', gap: 10 }, errorIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#35181d', alignItems: 'center', justifyContent: 'center' }, errorCopy: { flex: 1 }, errorTitle: { color: '#ffabb0', fontSize: 11, fontWeight: '900' }, errorText: { color: '#a9696e', fontSize: 9, marginTop: 3 }, retry: { paddingHorizontal: 10, paddingVertical: 8 }, retryText: { color: '#fff', fontSize: 10, fontWeight: '900' },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, loadingText: { color: '#777982', fontSize: 11, marginTop: 12 }, grid: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 24 }, gridEmpty: { flexGrow: 1 }, gridRow: { gap: 12 }, movieCard: { marginBottom: 19 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, posterWrap: { width: '100%', aspectRatio: 2 / 3, borderRadius: 10, overflow: 'hidden', backgroundColor: '#191a1f', borderWidth: 1, borderColor: '#26272d' }, poster: { width: '100%', height: '100%' }, posterFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' }, posterShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, backgroundColor: 'rgba(0,0,0,0.18)', borderBottomWidth: 35, borderBottomColor: 'rgba(0,0,0,0.38)' }, featuredBadge: { position: 'absolute', left: 7, top: 7, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: '#e50914', flexDirection: 'row', alignItems: 'center', gap: 3 }, featuredText: { color: '#fff', fontSize: 7, fontWeight: '900', letterSpacing: 0.4 }, cardPlay: { position: 'absolute', right: 8, bottom: 8, width: 31, height: 31, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 }, movieTitle: { color: '#f5f5f6', fontSize: 12, fontWeight: '900', marginTop: 8 }, movieMeta: { color: '#71727a', fontSize: 9, marginTop: 4 },
    empty: { flex: 1, minHeight: 290, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }, emptyIcon: { width: 75, height: 75, borderRadius: 23, backgroundColor: '#191a1f', borderWidth: 1, borderColor: '#282a31', alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 16 }, emptyText: { color: '#777982', fontSize: 11, textAlign: 'center', marginTop: 6 }, emptyButton: { backgroundColor: '#e50914', borderRadius: 9, paddingHorizontal: 17, paddingVertical: 11, marginTop: 17 }, emptyButtonText: { color: '#fff', fontSize: 11, fontWeight: '900' },
});
