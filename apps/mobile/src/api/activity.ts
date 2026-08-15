import type { ActivityLogRecordT } from '@workspace/shared/schema';

import { request } from './client';

export const activityApi = {
  list: (limit = 20) => request<ActivityLogRecordT[]>(`/api/activity?limit=${limit}`),
};
