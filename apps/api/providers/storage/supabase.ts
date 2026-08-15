import { admin } from '@/lib/supabase-admin';

import type { StorageProvider } from './index';

const BUCKET = 'files';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export class SupabaseStorageProvider implements StorageProvider {
  async createUploadUrl({ path }: { path: string; mimeType: string }) {
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return { uploadUrl: data.signedUrl };
  }

  async createSignedDownloadUrl(path: string) {
    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error) throw error;
    return { url: data.signedUrl };
  }
}
