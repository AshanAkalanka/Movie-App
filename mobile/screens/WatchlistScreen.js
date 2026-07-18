import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function WatchlistScreen() {
    const { user, loading: authLoading } = useAuth();
    const { watchlist, loading, toggleWatchlist } = useWatchlist();
    const router = useRouter();

    if (authLoading || loading) return <View style={styles.center}><ActivityIndicator color="#e50914" /></View>;

    if (!user) {
        return <AuthGate onLogin={() => router.push({ pathname: '/login', params: { returnTo: '/watchlist' } })} />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.header}>
                <View><Text style={styles.title}>My List</Text><Text style={styles.subtitle}>{watchlist.length} saved movie{watchlist.length === 1 ? '' : 's'}</Text></View>
                <View style={styles.avatar}><Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase()}</Text></View>
            </View>
            <FlatList
                data={watchlist}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={[styles.list, !watchlist.length && styles.emptyList]}
                renderItem={({ item }) => (
                    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(item.id) } })}>
                        <View style={styles.posterWrap}>{item.posterUrl ? <Image source={item.posterUrl} style={styles.poster} contentFit="cover" /> : <Ionicons name="film-outline" size={30} color="#e50914" />}</View>
                        <View style={styles.info}>
                            <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.meta}>{item.releaseYear || 'New'} · {item.category}</Text>
                            <View style={styles.playLabel}><Ionicons name="play-circle-outline" size={15} color="#aaa" /><Text style={styles.playLabelText}>View details & play</Text></View>
                        </View>
                        <Pressable accessibilityLabel={`Remove ${item.title} from My List`} hitSlop={12} onPress={() => toggleWatchlist(item)}><Ionicons name="close" size={24} color="#aaa" /></Pressable>
                    </Pressable>
                )}
                ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="bookmark-outline" size={45} color="#aaa" /></View><Text style={styles.emptyTitle}>Build your movie list</Text><Text style={styles.emptyText}>Save movies from Home or Details and find them here anytime.</Text><Pressable style={styles.browse} onPress={() => router.push('/')}><Text style={styles.browseText}>Browse Movies</Text></Pressable></View>}
            />
        </SafeAreaView>
    );
}

function AuthGate({ onLogin }) {
    return (
        <SafeAreaView style={styles.center}>
            <View style={styles.lockIcon}><Ionicons name="lock-closed" size={38} color="#fff" /></View>
            <Text style={styles.emptyTitle}>Sign in to use My List</Text>
            <Text style={styles.emptyText}>Sign in to keep the movies you love together in one place.</Text>
            <Pressable style={styles.login} onPress={onLogin}><Text style={styles.loginText}>Sign In</Text></Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 30 },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: '#fff', fontSize: 30, fontWeight: '900' },
    subtitle: { color: '#818181', fontSize: 12, marginTop: 4 },
    avatar: { width: 33, height: 33, borderRadius: 5, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontWeight: '900' },
    list: { paddingHorizontal: 16, paddingBottom: 88 },
    emptyList: { flexGrow: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#202020' },
    pressed: { opacity: 0.7 },
    posterWrap: { width: 126, height: 76, borderRadius: 6, overflow: 'hidden', backgroundColor: '#181818', alignItems: 'center', justifyContent: 'center' },
    poster: { width: '100%', height: '100%' },
    info: { flex: 1 },
    itemTitle: { color: '#fff', fontSize: 15, lineHeight: 19, fontWeight: '800' },
    meta: { color: '#999', fontSize: 11, marginTop: 5 },
    playLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
    playLabelText: { color: '#aaa', fontSize: 11 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
    emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center' },
    lockIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { color: '#fff', fontSize: 21, fontWeight: '900', marginTop: 20, textAlign: 'center' },
    emptyText: { color: '#929292', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
    browse: { backgroundColor: '#fff', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 5, marginTop: 22 },
    browseText: { color: '#000', fontWeight: '900' },
    login: { width: '100%', maxWidth: 320, backgroundColor: '#e50914', paddingVertical: 14, borderRadius: 6, alignItems: 'center', marginTop: 24 },
    loginText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
