import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { uploadFile } from '@/api/files';

export interface PickedAsset {
  uri: string;
  name: string;
  mimeType: string;
}

/** Camera quick action — real device camera, not a placeholder. */
export async function captureFromCamera(): Promise<PickedAsset | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Camera permission denied');

  const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

/** Upload quick action — real system file/photo picker. */
export async function pickDocument(): Promise<PickedAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
  };
}

/** Shared mutation: upload one picked asset, invalidate every screen that shows the result. */
export function useUploadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ asset, folderId }: { asset: PickedAsset; folderId?: string | null }) =>
      uploadFile(asset.uri, asset.name, asset.mimeType, folderId ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}
