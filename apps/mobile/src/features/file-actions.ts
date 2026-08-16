import * as Sharing from 'expo-sharing';
// see the comment in src/api/files.ts — /legacy is the procedural API
import * as FileSystem from 'expo-file-system/legacy';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { filesApi } from '@/api/files';
import type { FileRecordT } from '@workspace/shared/schema';

export async function shareFile(file: FileRecordT) {
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

/**
 * Favorite/share/delete, shared by the Files list (long-press) and the
 * file viewer screen (kebab button) — one real implementation instead of
 * two copies that could drift.
 */
export function useFileActions(onDeleted?: () => void) {
  const qc = useQueryClient();

  const toggleFavorite = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) => filesApi.update(id, { isFavorite }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  });

  const deleteFile = useMutation({
    mutationFn: (id: string) => filesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      onDeleted?.();
    },
  });

  function openActions(file: FileRecordT) {
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

  return { openActions, toggleFavorite, deleteFile };
}
