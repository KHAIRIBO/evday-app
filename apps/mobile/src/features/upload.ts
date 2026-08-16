import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { uploadFile } from '@/api/files';

export interface PickedAsset {
  uri: string;
  name: string;
  mimeType: string;
}

function extensionFor(mimeType: string): string {
  const sub = mimeType.split('/')[1];
  return sub ? sub.split('+')[0] : 'dat';
}

function nameFor(asset: { fileName?: string | null; mimeType?: string }, prefix: string) {
  if (asset.fileName) return asset.fileName;
  const mime = asset.mimeType ?? 'application/octet-stream';
  return `${prefix}-${Date.now()}.${extensionFor(mime)}`;
}

/**
 * Saves a just-captured photo to the device's own camera roll, in addition
 * to it being uploaded into the app — "camera saves the photo" means both,
 * not just one. Best-effort: a denied permission or save failure shouldn't
 * block the upload the user actually asked for.
 *
 * Dynamic import, not a top-level one: expo-media-library's Asset class
 * extends a native binding that doesn't exist on web, so a static import
 * throws ("Class extends value undefined") the moment this module is
 * evaluated there — which broke Metro's route-tree scan for every
 * platform, not just web, since that scan loads every screen's imports
 * eagerly. Same reason login.tsx dynamic-imports expo-local-authentication.
 */
export async function saveToDeviceLibrary(uri: string): Promise<boolean> {
  try {
    const MediaLibrary = await import('expo-media-library');
    // Positional boolean, not { writeOnly: true } — confirmed against the
    // installed package's own .d.ts, not just the docs summary.
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== 'granted') return false;
    await MediaLibrary.Asset.create(uri);
    return true;
  } catch {
    return false;
  }
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
    name: nameFor(asset, 'photo'),
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

/** Photos/Media quick action — real device photo library, images and videos, not just the camera. */
export async function pickFromLibrary(): Promise<PickedAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Photo library permission denied');

  // mediaTypes takes an array of MediaType strings as of this SDK — the
  // old MediaTypeOptions enum is deprecated (see AGENTS.md: verify against
  // the versioned docs, not stale training knowledge).
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.85 });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const isVideo = asset.type === 'video';
  return {
    uri: asset.uri,
    name: nameFor(asset, isVideo ? 'video' : 'photo'),
    mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
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
