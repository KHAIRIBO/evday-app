import type { ProfileRecordT } from '@workspace/shared/schema';

import { request } from './client';

export const profileApi = {
  get: () => request<ProfileRecordT>('/api/profile'),
  updateDisplayName: (displayName: string | null) =>
    request<{ message: string }>('/api/profile', { method: 'PATCH', body: JSON.stringify({ displayName }) }),
};
