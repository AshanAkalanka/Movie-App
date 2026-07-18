import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const PROFILE_STICKERS = [
    { id: '', label: 'Initial', emoji: '', color: '#e50914' },
    { id: 'sticker:popcorn', label: 'Popcorn', emoji: '🍿', color: '#8f4b12' },
    { id: 'sticker:film', label: 'Movies', emoji: '🎬', color: '#383b43' },
    { id: 'sticker:star', label: 'Star', emoji: '⭐', color: '#74530b' },
    { id: 'sticker:rocket', label: 'Rocket', emoji: '🚀', color: '#263b76' },
    { id: 'sticker:fox', label: 'Fox', emoji: '🦊', color: '#8a3e18' },
    { id: 'sticker:panda', label: 'Panda', emoji: '🐼', color: '#3d3f47' },
    { id: 'sticker:robot', label: 'Robot', emoji: '🤖', color: '#31576b' },
    { id: 'sticker:ghost', label: 'Ghost', emoji: '👻', color: '#5a4b87' },
    { id: 'sticker:unicorn', label: 'Unicorn', emoji: '🦄', color: '#8a386f' },
    { id: 'sticker:cool', label: 'Cool', emoji: '😎', color: '#27604b' },
];

export default function ProfileAvatar({ user, profileImage, name, size = 40, style }) {
    const selected = PROFILE_STICKERS.find((sticker) => sticker.id === (profileImage ?? user?.profileImage)) || PROFILE_STICKERS[0];
    const displayName = name ?? user?.name;
    return <View style={[styles.avatar, { width: size, height: size, borderRadius: Math.max(8, Math.round(size * 0.24)), backgroundColor: selected.color }, style]}>
        <Text style={[styles.content, { fontSize: selected.emoji ? size * 0.48 : size * 0.42 }]}>{selected.emoji || displayName?.trim()?.[0]?.toUpperCase() || 'G'}</Text>
    </View>;
}

const styles = StyleSheet.create({
    avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
    content: { color: '#fff', fontWeight: '900', textAlign: 'center', includeFontPadding: false },
});
