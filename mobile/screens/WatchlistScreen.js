import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import ProfileAvatar from '../components/ProfileAvatar';

export default function WatchlistScreen() {
    const { user, loading: authLoading } = useAuth();
    const { watchlist, loading, toggleWatchlist } = useWatchlist();
    const router = useRouter();

    if (authLoading || loading) return <View style={styles.center}><ActivityIndicator color="#e50914" /></View>;
    if (!user) return <AuthGate onLogin={() => router.push({ pathname: '/login', params: { returnTo: '/watchlist' } })} />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#08080a" />
            <View style={styles.header}>
                <View><View style={styles.eyebrowRow}><View style={styles.eyebrowLine} /><Text style={styles.eyebrow}>YOUR COLLECTION</Text></View><Text style={styles.title}>My List</Text><Text style={styles.subtitle}>{watchlist.length} saved movie{watchlist.length === 1 ? '' : 's'}</Text></View>
                <ProfileAvatar user={user} size={37} />
            </View>
            <FlatList
                data={watchlist}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={[styles.list, !watchlist.length && styles.emptyList]}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <View style={styles.row}>
                    <Pressable style={({ pressed }) => [styles.movieMain, pressed && styles.pressed]} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(item.id) } })}>
                        <View style={styles.posterWrap}>{item.posterUrl ? <Image source={item.posterUrl} style={styles.poster} contentFit="cover" /> : <Ionicons name="film-outline" size={30} color="#e50914" />}</View>
                        <View style={styles.info}>
                            <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.meta}>{item.releaseYear || 'New'}  •  {item.category}</Text>
                            <View style={styles.genreRow}>{(item.genres || []).slice(0, 2).map((genre) => <Text key={genre} style={styles.genre}>{genre}</Text>)}</View>
                            <Text style={styles.detailsLabel}>View movie details</Text>
                        </View>
                    </Pressable>
                    <View style={styles.itemActions}>
                        <Pressable accessibilityLabel={`Play ${item.title}`} style={styles.playAction} onPress={() => router.push({ pathname: '/watch/[id]', params: { id: String(item.id) } })}><Ionicons name="play" size={17} color="#050505" /></Pressable>
                        <Pressable accessibilityLabel={`Remove ${item.title} from My List`} style={styles.removeAction} onPress={() => toggleWatchlist(item)}><Ionicons name="trash-outline" size={18} color="#ff7a81" /></Pressable>
                    </View>
                </View>}
                ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="bookmark-outline" size={43} color="#aaa" /></View><Text style={styles.emptyTitle}>Build your movie list</Text><Text style={styles.emptyText}>Save movies from Home or Details and find them here anytime.</Text><Pressable style={styles.browse} onPress={() => router.push('/')}><Text style={styles.browseText}>Browse Movies</Text></Pressable></View>}
            />
        </SafeAreaView>
    );
}

function AuthGate({ onLogin }) {
    return <SafeAreaView style={styles.center}><View style={styles.lockIcon}><Ionicons name="lock-closed" size={37} color="#fff" /></View><Text style={styles.emptyTitle}>Sign in to use My List</Text><Text style={styles.emptyText}>Keep the movies you love together in one place.</Text><Pressable style={styles.login} onPress={onLogin}><Text style={styles.loginText}>Sign In</Text></Pressable></SafeAreaView>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08080a' }, center: { flex: 1, backgroundColor: '#08080a', alignItems: 'center', justifyContent: 'center', padding: 30 },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, eyebrowLine: { width: 20, height: 3, borderRadius: 2, backgroundColor: '#e50914' }, eyebrow: { color: '#ff5c65', fontSize: 8, fontWeight: '900', letterSpacing: 1.4 }, title: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.7, marginTop: 5 }, subtitle: { color: '#81828a', fontSize: 11, marginTop: 4 },
    list: { paddingHorizontal: 16, paddingBottom: 28 }, emptyList: { flexGrow: 1 }, row: { minHeight: 139, flexDirection: 'row', alignItems: 'center', backgroundColor: '#141519', borderRadius: 13, borderWidth: 1, borderColor: '#25262d', padding: 10, marginBottom: 10 }, movieMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }, pressed: { opacity: 0.7 }, posterWrap: { width: 77, height: 116, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1d1e23', alignItems: 'center', justifyContent: 'center' }, poster: { width: '100%', height: '100%' }, info: { flex: 1 }, itemTitle: { color: '#fff', fontSize: 15, lineHeight: 19, fontWeight: '900' }, meta: { color: '#85868f', fontSize: 10, marginTop: 6 }, genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 9 }, genre: { color: '#bbbcc2', fontSize: 8, borderRadius: 8, backgroundColor: '#292a31', paddingHorizontal: 7, paddingVertical: 4 }, detailsLabel: { color: '#e6e6e9', fontSize: 9, fontWeight: '800', marginTop: 10 }, itemActions: { width: 38, alignItems: 'center', gap: 12 }, playAction: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 }, removeAction: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#30181c', alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, emptyIcon: { width: 86, height: 86, borderRadius: 26, backgroundColor: '#1e1f24', alignItems: 'center', justifyContent: 'center' }, lockIcon: { width: 84, height: 84, borderRadius: 25, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 19, textAlign: 'center' }, emptyText: { color: '#92939b', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 }, browse: { backgroundColor: '#fff', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 8, marginTop: 21 }, browseText: { color: '#000', fontWeight: '900' }, login: { width: '100%', maxWidth: 320, backgroundColor: '#e50914', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 23 }, loginText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
