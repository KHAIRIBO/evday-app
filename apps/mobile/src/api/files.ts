// expo-file-system's default export is a new class-based (File/Directory/
// Paths) API as of this SDK — the procedural getInfoAsync/createUploadTask
// functions used below now live under the /legacy compatibility entry
// point instead.
import * as FileSystem from 'expo-file-system/legacy';

import type { CreateFileInputT, FileRecordT, UpdateFileInputT } from '@workspace/shared/schema';

import { request, requestPage } from './client';

export const filesApi = {
  list: (opts: { cursor?: string; folderId?: string; favorite?: boolean; type?: string; search?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.cursor) params.set('cursor', opts.cursor);
    if (opts.folderId) params.set('folderId', opts.folderId);
    if (opts.favorite) params.set('favorite', 'true');
    if (opts.type) params.set('type', opts.type);
    if (opts.search) params.set('search', opts.search);
    const qs = params.toString();
    return requestPage<FileRecordT>(`/api/files${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<FileRecordT>(`/api/files/${id}`),
  update: (id: string, patch: UpdateFileInputT) =>
    request<FileRecordT>(`/api/files/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => request<void>(`/api/files/${id}`, { method: 'DELETE' }),
  signedUrl: (id: string) => request<{ url: string }>(`/api/files/${id}/signed-url`),

  uploadUrl: (input: { name: string; mimeType: string; size: number }) =>
    request<{ uploadUrl: string; storagePath: string; fileId: string }>('/api/files/upload-url', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  create: (input: CreateFileInputT) => request<FileRecordT>('/api/files', { method: 'POST', body: JSON.stringify(input) }),
};

/**
 * The full 3-step upload from architecture.md: signed URL -> direct PUT to
 * storage -> commit the metadata row. `onProgress` gets 0..1.
 */
export async function uploadFile(
  uri: string,
  name: string,
  mimeType: string,
  folderId: string | null,
  onProgress?: (progress: number) => void,
): Promise<FileRecordT> {
  const info = await FileSystem.getInfoAsync(uri);
  const size = info.exists ? (info.size ?? 0) : 0;

  const { uploadUrl, storagePath } = await filesApi.uploadUrl({ name, mimeType, size });

  const task = FileSystem.createUploadTask(
    uploadUrl,
    uri,
    { httpMethod: 'PUT', headers: { 'Content-Type': mimeType } },
    (data) => onProgress?.(data.totalBytesExpectedToSend ? data.totalBytesSent / data.totalBytesExpectedToSend : 0),
  );

  const result = await task.uploadAsync();
  if (!result || result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed (status ${result?.status ?? 'unknown'})`);
  }

  return filesApi.create({ name, mimeType, size, folderId, storagePath });
}
