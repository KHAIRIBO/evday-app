import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { filesApi } from '@/api/files';
import { IconArrowLeft, IconMoreVertical, IconMusic, IconPause, IconPlay } from '@/components/icon';
import { IconButton } from '@/components/ui/icon-button';
import { shareFile, useFileActions } from '@/features/file-actions';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function AudioViewer({ url }: { url: string }) {
  // Real playback via expo-audio — play/pause/seek against an actual
  // signed URL, not a "download and hope the OS opens it" fallback.
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const pct = status.duration ? (status.currentTime / status.duration) * 100 : 0;

  return (
    <View style={styles.centerFill}>
      <View style={styles.audioArt}>
        <IconMusic size={40} color={Colors.limeText} />
      </View>
      <Text style={styles.audioTime}>
        {formatTime(status.currentTime)} / {formatTime(status.duration)}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Pressable style={styles.playButton} onPress={() => (status.playing ? player.pause() : player.play())}>
        {status.playing ? <IconPause size={22} color={Colors.limeText} /> : <IconPlay size={22} color={Colors.limeText} />}
      </Pressable>
    </View>
  );
}

function VideoViewer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
      allowsPictureInPicture
      fullscreenOptions={{ enable: true }}
    />
  );
}

export default function FileViewerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { openActions } = useFileActions(() => router.back());

  const file = useQuery({ queryKey: ['files', id], queryFn: () => filesApi.get(id), enabled: Boolean(id) });
  const signed = useQuery({
    queryKey: ['files', id, 'signedUrl'],
    queryFn: () => filesApi.signedUrl(id),
    enabled: Boolean(id),
  });

  const loading = file.isLoading || signed.isLoading;
  const mimeType = file.data?.mimeType ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <IconArrowLeft size={19} />
        </IconButton>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {file.data?.name ?? 'File'}
        </Text>
        <IconButton onPress={() => file.data && openActions(file.data)} disabled={!file.data}>
          <IconMoreVertical size={18} color="#fff" />
        </IconButton>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={Colors.lime} />
        </View>
      ) : file.isError || signed.isError || !file.data || !signed.data ? (
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>Could not open this file</Text>
        </View>
      ) : mimeType.startsWith('image/') ? (
        <Image source={{ uri: signed.data.url }} style={styles.image} resizeMode="contain" />
      ) : mimeType.startsWith('video/') ? (
        <VideoViewer url={signed.data.url} />
      ) : mimeType.startsWith('audio/') ? (
        <AudioViewer url={signed.data.url} />
      ) : (
        // No universal in-app renderer for arbitrary documents (PDF, docx,
        // …) without a native dependency this Expo Go setup can't load —
        // same constraint as the document scanner. Honest fallback: hand
        // it to the OS, not a fake "preview".
        <View style={styles.centerFill}>
          <Text style={styles.unsupportedText}>Khairibo can’t preview this file type in-app yet.</Text>
          <Pressable onPress={() => shareFile(file.data!)}>
            <Text style={styles.openExternalText}>Open with another app</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four - 6,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: Spacing.four,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: Colors.textMuted,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  audioArt: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(216,243,74,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(216,243,74,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  audioTime: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.textMuted,
  },
  progressTrack: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.lime,
  },
  playButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  unsupportedText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  openExternalText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.lime,
    marginTop: 4,
  },
});
