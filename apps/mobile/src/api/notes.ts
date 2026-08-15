import type { CreateNoteInputT, NoteRecordT, UpdateNoteInputT } from '@workspace/shared/schema';

import { request, requestPage } from './client';

export const notesApi = {
  list: (cursor?: string) => requestPage<NoteRecordT>(`/api/notes${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
  get: (id: string) => request<NoteRecordT>(`/api/notes/${id}`),
  create: (input: CreateNoteInputT) => request<NoteRecordT>('/api/notes', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: UpdateNoteInputT) =>
    request<NoteRecordT>(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => request<void>(`/api/notes/${id}`, { method: 'DELETE' }),
};
