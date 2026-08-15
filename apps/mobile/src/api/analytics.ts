import type { AnalyticsSummaryT } from '@workspace/shared/schema';

import { request } from './client';

export type AnalyticsPeriod = 'week' | 'month' | 'year';

export const analyticsApi = {
  summary: (period: AnalyticsPeriod = 'week') =>
    request<AnalyticsSummaryT>(`/api/analytics/summary?period=${period}`),
};
