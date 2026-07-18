import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function TrailerPlayer({ videoId, fullscreen = false }) {
    return (
        <View style={[styles.frame, fullscreen && styles.fullscreen]}>
            {React.createElement('iframe', {
                src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1`,
                title: 'Screenly trailer player',
                allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
                allowFullScreen: true,
                referrerPolicy: 'strict-origin-when-cross-origin',
                style: { border: 0, width: '100%', height: '100%' },
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    frame: { flex: 1, width: '100%', minHeight: 260, backgroundColor: '#000' },
    fullscreen: { minHeight: '100vh', height: '100vh' },
});
