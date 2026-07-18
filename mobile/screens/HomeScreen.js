import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MovieCard from '../components/MovieCard';
import { getMovies, groupMovies } from '../services/movies';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import ProfileAvatar from '../components/ProfileAvatar';

export default function HomeScreen() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [heroIndex, setHeroIndex] = useState(0);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { isSaved, toggleWatchlist } = useWatchlist();

    const loadMovies = useCallback(async () => {
        try { setError(''); setMovies(await getMovies()); }
        catch (requestError) { setError(requestError.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { loadMovies(); }, [loadMovies]));
    const collections = useMemo(() => groupMovies(movies), [movies]);
    const heroMovies = useMemo(() => {
        const featured = movies.filter((movie) => movie.featured);
        return featured.length ? featured : movies.slice(0, 1);
    }, [movies]);
    const heroMovie = heroMovies[heroIndex] || heroMovies[0];
    const heroSaved = heroMovie ? isSaved(heroMovie.id) : false;
    const categoryOptions = useMemo(() => {
        const counts = new Map();
        movies.forEach((movie) => {
            const name = movie.category || 'More to Watch';
            counts.set(name, (counts.get(name) || 0) + 1);
        });
        const featuredCount = movies.filter((movie) => movie.featured).length;
        return [{ name: 'All Categories', count: movies.length, icon: 'apps-outline' }, ...(featuredCount ? [{ name: 'Featured', count: featuredCount, icon: 'flame-outline' }] : []), ...Array.from(counts, ([name, count]) => ({ name, count, icon: categoryIcon(name) }))];
    }, [movies]);

    useEffect(() => {
        setHeroIndex((current) => current < heroMovies.length ? current : 0);
        if (heroMovies.length < 2) return undefined;
        const timer = setInterval(() => setHeroIndex((current) => (current + 1) % heroMovies.length), 7000);
        return () => clearInterval(timer);
    }, [heroMovies.length]);

    const playHero = () => {
        if (!heroMovie) return;
        if (!user) {
            router.push({ pathname: '/login', params: { returnTo: `/watch/${heroMovie.id}` } });
            return;
        }
        router.push({ pathname: '/watch/[id]', params: { id: String(heroMovie.id) } });
    };

    const secondaryHeroAction = () => {
        if (!heroMovie) return;
        if (user?.role === 'admin') {
            router.push({ pathname: '/admin-movie', params: { id: String(heroMovie.id) } });
            return;
        }
        if (!user) {
            router.push({ pathname: '/login', params: { returnTo: `/movie/${heroMovie.id}` } });
            return;
        }
        toggleWatchlist(heroMovie);
    };

    if (loading || authLoading) return <View style={styles.loading}><Image source={require('../assets/images/logo.png')} style={styles.loadingLogo} contentFit="contain" /><ActivityIndicator size="large" color="#e50914" /></View>;

    const shortcuts = user?.role === 'admin'
        ? [{ label: 'Movies', icon: 'film-outline', onPress: () => router.push('/search') }, { label: 'Featured', icon: 'flame-outline', onPress: () => router.push({ pathname: '/search', params: { category: 'Featured' } }) }, { label: 'Admin Studio', icon: 'shield-checkmark-outline', onPress: () => router.push('/admin') }, { label: 'Categories', icon: 'grid-outline', onPress: () => setCategoriesOpen(true) }]
        : [{ label: 'Movies', icon: 'film-outline', onPress: () => router.push('/search') }, { label: 'New & Hot', icon: 'flame-outline', onPress: () => router.push({ pathname: '/search', params: { category: 'Featured' } }) }, { label: 'My List', icon: 'bookmark-outline', onPress: () => router.push('/watchlist') }, { label: 'Categories', icon: 'grid-outline', onPress: () => setCategoriesOpen(true) }];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#08080a" />
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.brand}><Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="contain" /><Text style={styles.homeTitle}>Home</Text></View>
                <View style={styles.actions}>
                    <Pressable style={styles.headerAction} accessibilityLabel="Search movies" onPress={() => router.push('/search')}><Ionicons name="search-outline" size={23} color="#fff" /></Pressable>
                    {user?.role === 'admin' ? <Pressable style={styles.headerAction} accessibilityLabel="Open Admin Studio" onPress={() => router.push('/admin')}><Ionicons name="shield-checkmark-outline" size={23} color="#fff" /></Pressable> : null}
                    <Pressable style={styles.avatarButton} accessibilityLabel="Open profile" onPress={() => router.push('/profile')}><ProfileAvatar user={user} size={34} /></Pressable>
                </View>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} tintColor="#e50914" onRefresh={() => { setRefreshing(true); loadMovies(); }} />}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutRow}>
                    {shortcuts.map((shortcut) => <Pressable key={shortcut.label} style={[styles.shortcut, shortcut.label === 'Categories' && categoriesOpen && styles.shortcutActive]} onPress={shortcut.onPress}><Ionicons name={shortcut.icon} size={16} color="#ddd" /><Text style={styles.shortcutText}>{shortcut.label}</Text>{shortcut.label === 'Categories' ? <Ionicons name={categoriesOpen ? 'chevron-up' : 'chevron-down'} size={13} color="#aaa" /> : null}</Pressable>)}
                </ScrollView>

                {error ? <View style={styles.errorBox}><Ionicons name="cloud-offline-outline" size={21} color="#ff858c" /><View style={styles.errorCopy}><Text style={styles.errorTitle}>Couldn’t refresh movies</Text><Text style={styles.error}>{error}</Text></View><Pressable onPress={loadMovies}><Text style={styles.retry}>Retry</Text></Pressable></View> : null}

                {heroMovie ? <View style={styles.hero}>
                    <Image key={heroMovie.id} source={heroMovie.posterUrl || heroMovie.backdropUrl} style={styles.heroImage} contentFit="cover" transition={350} />
                    <View pointerEvents="none" style={styles.heroTint} />
                    <View pointerEvents="none" style={[styles.heroFade, styles.heroFadeOne]} />
                    <View pointerEvents="none" style={[styles.heroFade, styles.heroFadeTwo]} />
                    <View pointerEvents="none" style={[styles.heroFade, styles.heroFadeThree]} />
                    <View style={styles.heroTopRow}>
                        <View style={styles.premiere}><View style={styles.premiereMark}><Ionicons name="play" size={9} color="#fff" /></View><Text style={styles.premiereText}>SCREENLY FEATURE</Text></View>
                        {heroMovies.length > 1 ? <View style={styles.heroCount}><Text style={styles.heroCountText}>{heroIndex + 1} / {heroMovies.length}</Text></View> : null}
                    </View>
                    <View style={styles.heroContent}>
                        <Pressable accessibilityLabel={`View details for ${heroMovie.title}`} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(heroMovie.id) } })}>
                            <Text style={styles.heroTitle} numberOfLines={2}>{heroMovie.title}</Text>
                            <Text style={styles.heroMeta} numberOfLines={1}>{[heroMovie.releaseYear, heroMovie.maturityRating, ...(heroMovie.genres || []).slice(0, 2)].filter(Boolean).join('  •  ')}</Text>
                            <Text style={styles.heroDescription} numberOfLines={2}>{heroMovie.description}</Text>
                        </Pressable>
                        <View style={styles.heroButtons}>
                            <Pressable accessibilityLabel={`Play ${heroMovie.title}`} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]} onPress={playHero}><Ionicons name="play" size={22} color="#050505" /><Text style={styles.playText}>Play</Text></Pressable>
                            <Pressable accessibilityLabel={user?.role === 'admin' ? `Edit ${heroMovie.title}` : `${heroSaved ? 'Remove' : 'Add'} ${heroMovie.title} ${heroSaved ? 'from' : 'to'} My List`} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={secondaryHeroAction}><Ionicons name={user?.role === 'admin' ? 'create-outline' : heroSaved ? 'checkmark' : 'add'} size={22} color="#fff" /><Text style={styles.secondaryText}>{user?.role === 'admin' ? 'Edit Movie' : heroSaved ? 'In My List' : 'My List'}</Text></Pressable>
                        </View>
                        {heroMovies.length > 1 ? <View style={styles.heroDots}>{heroMovies.map((movie, index) => <Pressable key={movie.id} accessibilityLabel={`Show ${movie.title}`} onPress={() => setHeroIndex(index)} style={[styles.heroDot, index === heroIndex && styles.heroDotActive]} />)}</View> : null}
                    </View>
                </View> : null}

                {!collections.length ? <View style={styles.empty}>
                    <View style={styles.emptyIcon}><Ionicons name="film-outline" size={39} color="#fff" /></View>
                    <Text style={styles.emptyTitle}>Your Screenly catalog is ready</Text>
                    <Text style={styles.emptyText}>{user?.role === 'admin' ? 'Open Admin Studio and add your first movie.' : 'Movies added by the Screenly administrator will appear here.'}</Text>
                    {user?.role === 'admin' ? <Pressable style={styles.adminButton} onPress={() => router.push('/admin-movie')}><Ionicons name="add" size={20} color="#fff" /><Text style={styles.adminButtonText}>Add Movie</Text></Pressable> : null}
                </View> : collections.map((section) => <View key={section.id} style={styles.section}>
                    <Pressable accessibilityLabel={`Browse ${section.title}`} style={styles.sectionHeader} onPress={() => router.push(section.id === 'featured' ? { pathname: '/search', params: { category: 'Featured' } } : { pathname: '/search', params: { category: section.title } })}><Text style={styles.sectionTitle}>{section.title}</Text><Ionicons name="chevron-forward" size={19} color="#777" /></Pressable>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{section.items.map((movie) => <MovieCard key={`${section.id}-${movie.id}`} movie={movie} />)}</ScrollView>
                </View>)}
            </ScrollView>
            <Modal visible={categoriesOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setCategoriesOpen(false)}>
                <Pressable style={styles.dropdownBackdrop} onPress={() => setCategoriesOpen(false)}>
                    <SafeAreaView style={styles.dropdownLayer} pointerEvents="box-none">
                        <Pressable accessibilityViewIsModal style={styles.dropdown} onPress={(event) => event.stopPropagation()}>
                            <View style={styles.dropdownArrow} />
                            <View style={styles.dropdownHeader}><View><Text style={styles.dropdownEyebrow}>BROWSE SCREENLY</Text><Text style={styles.dropdownTitle}>Categories</Text></View><Pressable style={styles.dropdownClose} onPress={() => setCategoriesOpen(false)}><Ionicons name="close" size={19} color="#c6c7ce" /></Pressable></View>
                            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                                {categoryOptions.map((category) => <Pressable key={category.name} style={styles.dropdownItem} onPress={() => { setCategoriesOpen(false); router.push({ pathname: '/search', params: { category: category.name === 'All Categories' ? 'All' : category.name } }); }}><View style={styles.dropdownIcon}><Ionicons name={category.icon} size={18} color="#fff" /></View><View style={styles.dropdownCopy}><Text style={styles.dropdownName} numberOfLines={1}>{category.name}</Text><Text style={styles.dropdownCount}>{category.count} movie{category.count === 1 ? '' : 's'}</Text></View><Ionicons name="chevron-forward" size={17} color="#555760" /></Pressable>)}
                            </ScrollView>
                        </Pressable>
                    </SafeAreaView>
                </Pressable>
            </Modal>
        </View>
    );
}

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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08080a' }, scroll: { paddingBottom: 26, flexGrow: 1 }, loading: { flex: 1, backgroundColor: '#08080a', alignItems: 'center', justifyContent: 'center', gap: 18 }, loadingLogo: { width: 96, height: 96, borderRadius: 22 },
    header: { minHeight: 68, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 38, height: 38, borderRadius: 9 }, homeTitle: { color: '#fff', fontSize: 27, fontWeight: '900', letterSpacing: -0.6 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 9 }, headerAction: { width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, avatarButton: { width: 34, height: 34 },
    shortcutRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 9 }, shortcut: { height: 42, borderRadius: 21, paddingHorizontal: 15, backgroundColor: '#1d1d22', borderWidth: 1, borderColor: '#3a3a42', flexDirection: 'row', alignItems: 'center', gap: 7 }, shortcutActive: { borderColor: '#e50914', backgroundColor: '#281518' }, shortcutText: { color: '#eee', fontSize: 11, fontWeight: '800' },
    errorBox: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 11, backgroundColor: '#251316', borderWidth: 1, borderColor: '#432126', flexDirection: 'row', alignItems: 'center', gap: 10 }, errorCopy: { flex: 1 }, errorTitle: { color: '#ffacb1', fontSize: 11, fontWeight: '900' }, error: { color: '#a86a6f', fontSize: 9, marginTop: 3 }, retry: { color: '#fff', fontSize: 10, fontWeight: '900' },
    hero: { width: '92%', maxWidth: 620, aspectRatio: 0.72, maxHeight: 610, alignSelf: 'center', borderRadius: 18, backgroundColor: '#151519', overflow: 'hidden', borderWidth: 1, borderColor: '#303038' }, heroImage: { ...StyleSheet.absoluteFillObject }, heroTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' }, heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0 }, heroFadeOne: { height: '56%', backgroundColor: 'rgba(0,0,0,0.18)' }, heroFadeTwo: { height: '39%', backgroundColor: 'rgba(0,0,0,0.35)' }, heroFadeThree: { height: '23%', backgroundColor: 'rgba(0,0,0,0.62)' }, heroTopRow: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, premiere: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.52)', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 6 }, premiereMark: { width: 19, height: 19, borderRadius: 5, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, premiereText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 1 }, heroCount: { borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 5 }, heroCountText: { color: '#eee', fontSize: 8, fontWeight: '800' }, heroContent: { position: 'absolute', left: 16, right: 16, bottom: 15 }, heroTitle: { color: '#fff', fontSize: 31, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }, heroMeta: { color: '#efeff1', fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 7 }, heroDescription: { color: '#d0d0d4', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 7 }, heroButtons: { flexDirection: 'row', gap: 9, marginTop: 14 }, playButton: { flex: 1, height: 45, borderRadius: 7, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, playText: { color: '#050505', fontSize: 14, fontWeight: '900' }, secondaryButton: { flex: 1, height: 45, borderRadius: 7, backgroundColor: 'rgba(48,48,54,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, secondaryText: { color: '#fff', fontSize: 13, fontWeight: '900' }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] }, heroDots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 11 }, heroDot: { width: 7, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.36)' }, heroDotActive: { width: 25, backgroundColor: '#e50914' },
    section: { marginTop: 22 }, sectionHeader: { marginHorizontal: 16, marginBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 3 }, sectionTitle: { color: '#fff', fontSize: 19, fontWeight: '900', letterSpacing: -0.25 }, row: { paddingLeft: 16, paddingRight: 6 }, empty: { flex: 1, minHeight: 470, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, emptyIcon: { width: 78, height: 78, borderRadius: 23, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: '#fff', fontSize: 21, fontWeight: '900', marginTop: 18, textAlign: 'center' }, emptyText: { color: '#888a92', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 360 }, adminButton: { marginTop: 20, height: 46, borderRadius: 8, paddingHorizontal: 20, backgroundColor: '#e50914', flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, adminButtonText: { color: '#fff', fontWeight: '900' },
    dropdownBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)' }, dropdownLayer: { flex: 1 }, dropdown: { position: 'absolute', top: 122, right: 14, width: 250, maxHeight: 440, borderRadius: 17, backgroundColor: '#15161b', borderWidth: 1, borderColor: '#343640', padding: 9, shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 18 }, dropdownArrow: { position: 'absolute', top: -6, right: 25, width: 12, height: 12, backgroundColor: '#15161b', borderLeftWidth: 1, borderTopWidth: 1, borderColor: '#343640', transform: [{ rotate: '45deg' }] }, dropdownHeader: { minHeight: 58, paddingHorizontal: 8, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: '#292a31', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dropdownEyebrow: { color: '#ff5962', fontSize: 7, fontWeight: '900', letterSpacing: 1.3 }, dropdownTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 3 }, dropdownClose: { width: 31, height: 31, borderRadius: 10, backgroundColor: '#24252b', alignItems: 'center', justifyContent: 'center' }, dropdownScroll: { maxHeight: 344 }, dropdownItem: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 7, borderBottomWidth: 1, borderBottomColor: '#24252b' }, dropdownIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#292a31', alignItems: 'center', justifyContent: 'center' }, dropdownCopy: { flex: 1 }, dropdownName: { color: '#f3f3f5', fontSize: 12, fontWeight: '900' }, dropdownCount: { color: '#6f717a', fontSize: 8, marginTop: 3 },
});
