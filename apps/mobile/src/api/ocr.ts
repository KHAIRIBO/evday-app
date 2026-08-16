import type { OcrResultT } from '@workspace/shared/schema';

import { request } from './client';

export const ocrApi = {
  process: (fileId: string) =>
    request<OcrResultT>('/api/ocr/process', { method: 'POST', body: JSON.stringify({ fileId }) }),
};
