import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MovieCard({ movie, compact = false, showDetails = false }) {
    const router = useRouter();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${movie.title}`}
            onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(movie.id) } })}
            style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
        >
            <View style={styles.posterWrap}>
                {movie.posterUrl ? <Image source={movie.posterUrl} style={styles.poster} contentFit="cover" transition={180} /> : <View style={styles.fallback}><Ionicons name="film-outline" size={36} color="#e50914" /></View>}
                {movie.featured ? <View style={styles.featuredBadge}><Text style={styles.featuredText}>FEATURED</Text></View> : null}
            </View>
            {showDetails ? <><Text style={styles.title} numberOfLines={1}>{movie.title}</Text><Text style={styles.meta} numberOfLines={1}>{movie.releaseYear || 'New'} · {movie.maturityRating || 'NR'}</Text></> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { width: 132, marginRight: 10 }, compact: { width: 116 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
    posterWrap: { width: '100%', aspectRatio: 2 / 3, borderRadius: 7, overflow: 'hidden', backgroundColor: '#171717' }, poster: { width: '100%', height: '100%' }, fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    featuredBadge: { position: 'absolute', left: 6, bottom: 6, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: '#e50914' }, featuredText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
    title: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 8 }, meta: { color: '#858585', fontSize: 11, marginTop: 3 },
});
