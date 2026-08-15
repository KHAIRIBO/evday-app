import type { CreateFolderInputT, FolderRecordT, UpdateFolderInputT } from '@workspace/shared/schema';

import { request } from './client';

export const foldersApi = {
  list: (parentId?: string | null) =>
    request<FolderRecordT[]>(`/api/folders${parentId ? `?parentId=${parentId}` : ''}`),
  create: (input: CreateFolderInputT) =>
    request<FolderRecordT>('/api/folders', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: UpdateFolderInputT) =>
    request<FolderRecordT>(`/api/folders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => request<void>(`/api/folders/${id}`, { method: 'DELETE' }),
};
