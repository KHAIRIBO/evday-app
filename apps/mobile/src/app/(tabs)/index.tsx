import { useQuery } from '@tanstack/react-query';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityApi } from '@/api/activity';
import { analyticsApi, type AnalyticsPeriod } from '@/api/analytics';
import { ocrApi } from '@/api/ocr';
import {
  IconBell,
  IconBot,
  IconCamera,
  IconDatabase,
  IconFileText,
  IconImage,
  IconMic,
  IconPencil,
  IconScan,
  IconSearch,
  IconUpload,
  IconUser,
} from '@/components/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ListItem } from '@/components/ui/list-item';
import { Panel } from '@/components/ui/panel';
import { WeatherCard } from '@/components/weather-card';
import { QuickAction } from '@/components/ui/quick-action';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented';
import { StatCard } from '@/components/ui/stat-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { captureFromCamera, pickDocument, pickFromLibrary, saveToDeviceLibrary, useUploadMutation } from '@/features/upload';
import type { ActivityLogRecordT } from '@workspace/shared/schema';

const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 GB';
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(0)} MB`;
}

const KIND_LABEL: Record<string, string> = { image: 'Images', document: 'Docs', video: 'Video', other: 'Other' };

const ACTION_META: Record<string, { icon: typeof IconFileText; label: string }> = {
  file_upload: { icon: IconFileText, label: 'Uploaded' },
  file_delete: { icon: IconFileText, label: 'Deleted' },
  note_created: { icon: IconPencil, label: 'Note created' },
  assistant_reply: { icon: IconBot, label: 'AI chat' },
};

function describeActivity(log: ActivityLogRecordT) {
  const meta = ACTION_META[log.action] ?? { icon: IconFileText, label: log.action };
  const name = (log.metadata?.name as string | undefined) ?? meta.label;
  const time = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { Icon: meta.icon, name, meta: `${meta.label} · ${time}` };
}

function groupByDay(logs: ActivityLogRecordT[]) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const groups: { title: string; items: ActivityLogRecordT[] }[] = [];
  for (const log of logs) {
    const day = new Date(log.createdAt).toDateString();
    const title = day === today ? 'Today' : day === yesterday ? 'Yesterday' : new Date(log.createdAt).toLocaleDateString();
    let group = groups.find((g) => g.title === title);
    if (!group) {
      group = { title, items: [] };
      groups.push(group);
    }
    group.items.push(log);
  }
  return groups;
}

export default function HomeScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const upload = useUploadMutation();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [scanning, setScanning] = useState(false);

  const analytics = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => analyticsApi.summary(period),
  });
  const activity = useQuery({
    queryKey: ['activity'],
    queryFn: () => activityApi.list(20),
  });

  const maxCount = useMemo(() => Math.max(1, ...(analytics.data?.activity.map((a) => a.count) ?? [1])), [analytics.data]);
  const activityGroups = useMemo(() => groupByDay(activity.data ?? []), [activity.data]);
  const usedPct = analytics.data ? Math.min(100, Math.round((analytics.data.storageUsed / (analytics.data.storageQuota || 1)) * 100)) : 0;

  async function handleCamera() {
    try {
      const asset = await captureFromCamera();
      if (!asset) return;
      await upload.mutateAsync({ asset });
      // Best-effort: also save the photo to the device's own camera roll,
      // not just upload it into the app. A denied/failed gallery write
      // shouldn't surface as an upload failure — the file already
      // uploaded fine either way.
      void saveToDeviceLibrary(asset.uri);
    } catch (e) {
      Alert.alert('Camera', e instanceof Error ? e.message : 'Could not capture photo');
    }
  }

  async function handleUpload() {
    try {
      const asset = await pickDocument();
      if (!asset) return;
      await upload.mutateAsync({ asset });
    } catch (e) {
      Alert.alert('Upload', e instanceof Error ? e.message : 'Could not upload file');
    }
  }

  async function handleMedia() {
    try {
      const asset = await pickFromLibrary();
      if (!asset) return;
      await upload.mutateAsync({ asset });
    } catch (e) {
      Alert.alert('Media', e instanceof Error ? e.message : 'Could not upload from your library');
    }
  }

  async function handleAudio() {
    // Tap once to start, tap again to stop and upload — a real recorder,
    // not a placeholder, using the device microphone via expo-audio.
    if (recorderState.isRecording) {
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error('Recording produced no file');
        await upload.mutateAsync({ asset: { uri, name: `audio-${Date.now()}.m4a`, mimeType: 'audio/m4a' } });
      } catch (e) {
        Alert.alert('Audio', e instanceof Error ? e.message : 'Could not save recording');
      }
      return;
    }
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) throw new Error('Microphone permission denied');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      Alert.alert('Audio', e instanceof Error ? e.message : 'Could not start recording');
    }
  }

  async function handleScan() {
    // There's no built-in Expo document scanner (verified against the v57
    // docs, per AGENTS.md — Expo has no plans to add one; the real
    // community options wrap ML Kit/VisionKit and need a custom dev
    // client, which this app isn't running as — it's Expo Go). What's
    // real and works today: capture a photo, upload it, then run it
    // through the OCR pipeline that's already wired to Anthropic's
    // vision model. Genuine text extraction from a photographed
    // document — just without page-edge detection/perspective
    // correction, which would need that custom dev client.
    if (scanning) return;
    try {
      const asset = await captureFromCamera();
      if (!asset) return;
      setScanning(true);
      const file = await upload.mutateAsync({ asset });
      const result = await ocrApi.process(file.id);
      Alert.alert(
        'Scan complete',
        result.extractedText?.trim() ? result.extractedText.slice(0, 500) : 'No text was found in the photo.',
      );
    } catch (e) {
      Alert.alert('Scan', e instanceof Error ? e.message : 'Could not scan document');
    } finally {
      setScanning(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Overview</Text>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton>
            <IconSearch size={18} />
          </IconButton>
          <IconButton>
            <IconBell size={18} />
          </IconButton>
          <IconButton onPress={() => router.push('/profile')}>
            <IconUser size={18} />
          </IconButton>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={analytics.isFetching || activity.isFetching}
            onRefresh={() => {
              analytics.refetch();
              activity.refetch();
            }}
            tintColor={Colors.lime}
          />
        }>
        <SegmentedControl
          options={PERIODS.map((p) => p.label)}
          value={PERIODS.find((p) => p.value === period)?.label ?? 'Week'}
          onChange={(label) => setPeriod(PERIODS.find((p) => p.label === label)?.value ?? 'week')}
        />

        <WeatherCard />

        {analytics.isLoading ? (
          <Panel style={styles.centerPanel}>
            <ActivityIndicator color={Colors.lime} />
          </Panel>
        ) : analytics.isError ? (
          <Panel style={styles.centerPanel}>
            <Text style={styles.errorText}>Unable to load your overview</Text>
            <Pressable onPress={() => analytics.refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </Panel>
        ) : (
          <>
            <Panel variant="lime" style={{ marginTop: 14 }}>
              <View style={styles.storageTop}>
                <View>
                  <Text style={styles.storageVal}>{formatBytes(analytics.data!.storageUsed)}</Text>
                  <Text style={styles.storageLbl}>
                    of {formatBytes(analytics.data!.storageQuota)} used · {usedPct}%
                  </Text>
                </View>
                <IconDatabase size={20} />
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${usedPct}%` }]} />
              </View>
              {analytics.data!.breakdown.length > 0 && (
                <View style={styles.breakdownRow}>
                  {analytics.data!.breakdown.map((b) => (
                    <Text key={b.kind} style={styles.breakdownItem}>
                      {KIND_LABEL[b.kind] ?? b.kind} {formatBytes(b.bytes)}
                    </Text>
                  ))}
                </View>
              )}
            </Panel>

            <View style={styles.statRow}>
              <StatCard
                icon={<IconFileText size={17} />}
                delta={`${analytics.data!.filesDelta >= 0 ? '+' : ''}${analytics.data!.filesDelta}`}
                deltaPositive={analytics.data!.filesDelta >= 0}
                value={String(analytics.data!.filesThisWeek)}
                label={period === 'week' ? 'Files this week' : period === 'month' ? 'Files this month' : 'Files this year'}
              />
              <StatCard
                icon={<IconBot size={17} color={Colors.lime} />}
                delta={`${analytics.data!.aiDelta >= 0 ? '+' : ''}${analytics.data!.aiDelta}`}
                deltaPositive={analytics.data!.aiDelta >= 0}
                value={String(analytics.data!.aiQueries)}
                label="AI queries"
              />
            </View>

            <Panel>
              <View style={styles.activityTop}>
                <View>
                  <Text style={styles.activityTitle}>Activity</Text>
                  <Text style={styles.activitySubtitle}>
                    {analytics.data!.activity.reduce((sum, a) => sum + a.count, 0)} actions
                  </Text>
                </View>
              </View>
              <View style={styles.bars}>
                {analytics.data!.activity.map((a, i) => {
                  const pct = Math.round((a.count / maxCount) * 100);
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View style={[styles.bar, { height: `${Math.max(pct, 4)}%` }, pct === 100 && a.count > 0 && styles.barOn]} />
                      </View>
                      <Text style={styles.barLbl}>
                        {period === 'year' ? a.date.slice(5, 7) : new Date(a.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Panel>
          </>
        )}

        <View>
          <SectionHeader title="Quick actions" />
          <View style={styles.quickGrid}>
            <QuickAction icon={<IconCamera />} label="Camera" onPress={handleCamera} />
            <QuickAction icon={<IconImage />} label="Media" onPress={handleMedia} />
            <QuickAction icon={<IconUpload />} label="Upload" onPress={handleUpload} />
            <QuickAction
              icon={<IconMic color={recorderState.isRecording ? Colors.danger : '#fff'} />}
              label={recorderState.isRecording ? 'Stop' : 'Audio'}
              onPress={handleAudio}
            />
            <QuickAction icon={<IconScan />} label={scanning ? 'Scanning…' : 'Scan'} onPress={handleScan} />
            <QuickAction icon={<IconFileText size={19} />} label="Calc" onPress={() => router.push('/(tabs)/calculator')} />
          </View>
          {upload.isPending && <Text style={styles.uploadingText}>Uploading…</Text>}
          {recorderState.isRecording && <Text style={styles.recordingText}>Recording… tap Audio again to stop and upload</Text>}
          {scanning && <Text style={styles.uploadingText}>Scanning document…</Text>}
        </View>

        {activity.isLoading ? null : activityGroups.length === 0 ? (
          <View>
            <SectionHeader title="Activity" />
            <Text style={styles.emptyText}>No activity yet — upload a file or take a photo to get started.</Text>
          </View>
        ) : (
          activityGroups.map((group) => (
            <View key={group.title}>
              <SectionHeader title={group.title} />
              <View style={styles.list}>
                {group.items.map((log) => {
                  const { Icon, name, meta } = describeActivity(log);
                  return <ListItem key={log.id} icon={<Icon size={18} />} name={name} meta={meta} />;
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    paddingBottom: Spacing.three - 2,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.4,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.four - 6,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: Spacing.four,
  },
  centerPanel: {
    marginTop: 14,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: Colors.textMuted,
  },
  retryText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.lime,
  },
  storageTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  storageVal: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    color: Colors.limeText,
    letterSpacing: -0.5,
  },
  storageLbl: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: 'rgba(19,19,19,0.62)',
    marginTop: 5,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(19,19,19,0.16)',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.limeText,
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },
  breakdownItem: {
    fontFamily: Fonts.semiBold,
    fontSize: 9.5,
    color: 'rgba(19,19,19,0.66)',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  activityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.text,
  },
  activitySubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    height: 74,
    marginTop: 12,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    minHeight: 4,
  },
  barOn: {
    backgroundColor: Colors.lime,
  },
  barLbl: {
    fontFamily: Fonts.semiBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  uploadingText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.lime,
    marginTop: 8,
    textAlign: 'center',
  },
  recordingText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.danger,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  list: {
    gap: 8,
  },
});
