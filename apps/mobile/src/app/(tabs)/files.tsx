import * as Sharing from 'expo-sharing';
// see the comment in src/api/files.ts — /legacy is the procedural API
import * as FileSystem from 'expo-file-system/legacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { filesApi } from '@/api/files';
import { foldersApi } from '@/api/folders';
import {
  IconFileText,
  IconFolder,
  IconImage,
  IconPlus,
  IconSearch,
  IconSpreadsheet,
  IconVideo,
} from '@/components/icon';
import { FilterChip } from '@/components/ui/filter-chip';
import { IconButton } from '@/components/ui/icon-button';
import { ListItem } from '@/components/ui/list-item';
import { SectionHeader } from '@/components/ui/section-header';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { pickDocument, useUploadMutation } from '@/features/upload';
import type { FileRecordT } from '@workspace/shared/schema';

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Images', value: 'image' },
  { label: 'Docs', value: 'document' },
  { label: 'Scans', value: 'scan' },
] as const;

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function iconForFile(file: FileRecordT) {
  if (file.mimeType.startsWith('image/')) return IconImage;
  if (file.mimeType.startsWith('video/')) return IconVideo;
  if (file.mimeType.includes('spreadsheet') || file.mimeType.includes('csv')) return IconSpreadsheet;
  return IconFileText;
}

export default function FilesScreen() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>(undefined);
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const folders = useQuery({ queryKey: ['folders', 'root'], queryFn: () => foldersApi.list(null) });
  const files = useQuery({
    queryKey: ['files', { filter, folder: selectedFolder?.id, search }],
    queryFn: () => filesApi.list({ type: filter, folderId: selectedFolder?.id, search: search || undefined }),
  });

  const upload = useUploadMutation();

  const createFolder = useMutation({
    mutationFn: (name: string) => foldersApi.create({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setCreatingFolder(false);
      setNewFolderName('');
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) => filesApi.update(id, { isFavorite }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  });

  const deleteFile = useMutation({
    mutationFn: (id: string) => filesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const totalBytes = useMemo(() => (files.data?.data ?? []).reduce((sum, f) => sum + f.size, 0), [files.data]);

  async function handleUploadButton() {
    Alert.alert('Add', undefined, [
      {
        text: 'Upload file',
        onPress: async () => {
          const asset = await pickDocument();
          if (asset) await upload.mutateAsync({ asset, folderId: selectedFolder?.id ?? null });
        },
      },
      { text: 'New folder', onPress: () => setCreatingFolder(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleFileActions(file: FileRecordT) {
    Alert.alert(file.name, undefined, [
      {
        text: file.isFavorite ? 'Remove from favorites' : 'Add to favorites',
        onPress: () => toggleFavorite.mutate({ id: file.id, isFavorite: !file.isFavorite }),
      },
      { text: 'Share', onPress: () => shareFile(file) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete file?', `"${file.name}" will be moved to trash.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteFile.mutate(file.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function shareFile(file: FileRecordT) {
    try {
      const { url } = await filesApi.signedUrl(file.id);
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing unavailable', 'This device can’t open the share sheet.');
        return;
      }
      const localPath = `${FileSystem.cacheDirectory}${file.name}`;
      const { uri } = await FileSystem.downloadAsync(url, localPath);
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Share failed', e instanceof Error ? e.message : 'Could not share this file');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Files</Text>
          <Text style={styles.subtitle}>
            {files.data ? `${files.data.data.length} items · ${formatBytes(totalBytes)}` : ' '}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton onPress={() => setSearchOpen((s) => !s)}>
            <IconSearch size={18} />
          </IconButton>
          <IconButton accent onPress={handleUploadButton}>
            <IconPlus size={18} />
          </IconButton>
        </View>
      </View>

      {searchOpen && (
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search files..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoFocus
          />
        </View>
      )}

      {creatingFolder && (
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={newFolderName}
            onChangeText={setNewFolderName}
            placeholder="Folder name"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoFocus
            onSubmitEditing={() => newFolderName.trim() && createFolder.mutate(newFolderName.trim())}
            returnKeyType="done"
          />
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={files.isFetching} onRefresh={() => files.refetch()} tintColor={Colors.lime} />
        }>
        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <FilterChip key={f.label} label={f.label} active={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
          {selectedFolder && (
            <FilterChip label={`${selectedFolder.name} ✕`} active onPress={() => setSelectedFolder(null)} />
          )}
        </View>

        {!selectedFolder && (
          <View>
            <SectionHeader title="Folders" />
            {folders.isLoading ? (
              <ActivityIndicator color={Colors.lime} />
            ) : folders.data?.length ? (
              <View style={styles.list}>
                {folders.data.map((f) => (
                  <ListItem
                    key={f.id}
                    icon={<IconFolder size={18} />}
                    name={f.name}
                    meta="Tap to open"
                    onPress={() => setSelectedFolder({ id: f.id, name: f.name })}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No folders yet.</Text>
            )}
          </View>
        )}

        <View>
          <SectionHeader title={selectedFolder ? selectedFolder.name : 'Recent files'} />
          {files.isLoading ? (
            <ActivityIndicator color={Colors.lime} />
          ) : files.isError ? (
            <View>
              <Text style={styles.emptyText}>Unable to load files.</Text>
              <Pressable onPress={() => files.refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : files.data?.data.length ? (
            <View style={styles.list}>
              {files.data.data.map((f) => {
                const Icon = iconForFile(f);
                return (
                  <ListItem
                    key={f.id}
                    icon={<Icon size={18} color={f.isFavorite ? Colors.limeText : undefined} />}
                    solid={f.isFavorite}
                    name={f.name}
                    meta={`${formatBytes(f.size)} · ${new Date(f.createdAt).toLocaleDateString()}`}
                    trailing="kebab"
                    onPress={() => handleFileActions(f)}
                  />
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              {search ? `No files match “${search}”.` : 'No files yet — upload one to get started.'}
            </Text>
          )}
        </View>
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
  searchWrap: {
    paddingHorizontal: Spacing.four - 6,
    paddingBottom: Spacing.two,
  },
  searchInput: {
    height: 44,
    borderRadius: Radii.lg,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.fieldBorder,
    color: Colors.text,
    paddingHorizontal: 14,
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.four - 6,
  },
  scrollContent: {
    gap: 18,
    paddingBottom: Spacing.four,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  list: {
    gap: 8,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  retryText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.lime,
    marginTop: 8,
  },
});
