import React from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function ProfileScreen() {
    const { user, loading, logout } = useAuth();
    const { watchlist } = useWatchlist();
    const router = useRouter();

    if (loading) return <View style={styles.center}><ActivityIndicator color="#e50914" /></View>;

    if (!user) {
        return (
            <SafeAreaView style={styles.center}>
                <View style={styles.guestAvatar}><Ionicons name="person-outline" size={42} color="#fff" /></View>
                <Text style={styles.guestTitle}>Your Screenly profile</Text>
                <Text style={styles.guestText}>Sign in to watch trailers, save your favorites, and keep a personal list.</Text>
                <Pressable style={styles.signIn} onPress={() => router.push({ pathname: '/login', params: { returnTo: '/profile' } })}><Text style={styles.signInText}>Sign In</Text></Pressable>
                <Pressable style={styles.register} onPress={() => router.push({ pathname: '/register', params: { returnTo: '/profile' } })}><Text style={styles.registerText}>Create Account</Text></Pressable>
            </SafeAreaView>
        );
    }

    const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Recently';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <Text style={styles.heading}>My Profile</Text>
            <View style={styles.profileCard}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase()}</Text></View>
                <View style={styles.identity}><Text style={styles.name}>{user.name}</Text><Text style={styles.email}>{user.email}</Text><Text style={styles.joined}>Member since {joined}</Text></View>
            </View>

            <View style={styles.statsRow}>
                {user.role === 'admin' ? <><View style={styles.statCard}><Ionicons name="grid" size={25} color="#8f83ff" /><Text style={styles.statLabel}>Console access</Text></View><View style={styles.statCard}><Ionicons name="people" size={25} color="#e50914" /><Text style={styles.statLabel}>Member controls</Text></View></> : <><View style={styles.statCard}><Text style={styles.statValue}>{watchlist.length}</Text><Text style={styles.statLabel}>Movies saved</Text></View><View style={styles.statCard}><Ionicons name="play-circle" size={25} color="#e50914" /><Text style={styles.statLabel}>Ready to watch</Text></View></>}
            </View>

            <View style={styles.menu}>
                {user.role !== 'admin' ? <MenuRow icon="bookmark-outline" title="My List" subtitle="Everything you want to watch" onPress={() => router.push('/watchlist')} /> : null}
                {user.role === 'admin' ? <MenuRow icon="grid-outline" title="Screenly Console" subtitle="Movies, members and audience insights" success onPress={() => router.push('/admin')} /> : null}
                <MenuRow icon="play-circle-outline" title="In-app playback" subtitle="Watch without leaving Screenly" success />
                <MenuRow icon="shield-checkmark-outline" title="Account & privacy" subtitle="Your profile and sign-in settings" />
            </View>

            <Pressable style={styles.logout} onPress={logout}><Ionicons name="log-out-outline" size={20} color="#ff6f76" /><Text style={styles.logoutText}>Sign Out</Text></Pressable>
            <Text style={styles.footer}>Find a story, press play, and enjoy.</Text>
        </SafeAreaView>
    );
}

function MenuRow({ icon, title, subtitle, success, onPress }) {
    const content = <><View style={styles.menuIcon}><Ionicons name={icon} size={21} color={success ? '#46d369' : '#ddd'} /></View><View style={styles.menuText}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View>{onPress ? <Ionicons name="chevron-forward" size={19} color="#666" /> : null}</>;
    return onPress ? <Pressable style={styles.menuRow} onPress={onPress}>{content}</Pressable> : <View style={styles.menuRow}>{content}</View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 16 }, center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 30 },
    heading: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 8, marginBottom: 20 }, profileCard: { backgroundColor: '#171717', borderRadius: 10, borderWidth: 1, borderColor: '#292929', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 15 },
    avatar: { width: 64, height: 64, borderRadius: 9, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' }, identity: { flex: 1 }, name: { color: '#fff', fontSize: 19, fontWeight: '900' }, email: { color: '#999', fontSize: 12, marginTop: 4 }, joined: { color: '#666', fontSize: 10, marginTop: 7 },
    statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 }, statCard: { flex: 1, minHeight: 82, borderRadius: 9, backgroundColor: '#171717', borderWidth: 1, borderColor: '#292929', alignItems: 'center', justifyContent: 'center' }, statValue: { color: '#fff', fontSize: 24, fontWeight: '900' }, statLabel: { color: '#888', fontSize: 11, marginTop: 5 },
    menu: { backgroundColor: '#141414', borderRadius: 10, borderWidth: 1, borderColor: '#292929', marginTop: 18, overflow: 'hidden' }, menuRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#252525' }, menuIcon: { width: 38 }, menuText: { flex: 1 }, menuTitle: { color: '#fff', fontSize: 14, fontWeight: '800' }, menuSubtitle: { color: '#777', fontSize: 11, marginTop: 3 },
    logout: { height: 48, borderRadius: 7, backgroundColor: '#281214', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18 }, logoutText: { color: '#ff6f76', fontWeight: '900' }, footer: { color: '#555', fontSize: 10, textAlign: 'center', marginTop: 18 },
    guestAvatar: { width: 88, height: 88, borderRadius: 18, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, guestTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 22 }, guestText: { color: '#999', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 340 }, signIn: { width: '100%', maxWidth: 330, height: 48, borderRadius: 6, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center', marginTop: 25 }, signInText: { color: '#fff', fontWeight: '900' }, register: { width: '100%', maxWidth: 330, height: 48, borderRadius: 6, borderWidth: 1, borderColor: '#555', alignItems: 'center', justifyContent: 'center', marginTop: 10 }, registerText: { color: '#fff', fontWeight: '800' },
});
