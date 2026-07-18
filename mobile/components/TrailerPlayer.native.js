import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

export default function TrailerPlayer({ videoId, onError, fullscreen = false }) {
    const { width, height } = useWindowDimensions();
    const playerWidth = fullscreen ? width : Math.min(width, 900);
    const playerHeight = fullscreen ? height : Math.round(playerWidth * 9 / 16);

    return (
        <View style={styles.frame}>
            <YoutubePlayer
                height={playerHeight}
                width={playerWidth}
                play
                videoId={videoId}
                onError={onError}
                initialPlayerParams={{ preventFullScreen: false, rel: false, modestbranding: true, controls: true }}
                webViewProps={{ allowsFullscreenVideo: true, mediaPlaybackRequiresUserAction: false }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    frame: { flex: 1, width: '100%', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
