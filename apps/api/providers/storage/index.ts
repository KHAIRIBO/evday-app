export interface StorageProvider {
  createUploadUrl(input: { path: string; mimeType: string }): Promise<{ uploadUrl: string }>;
  createSignedDownloadUrl(path: string): Promise<{ url: string }>;
}

import { SupabaseStorageProvider } from './supabase';
// TODO: google-drive.ts — no OAuth flow or UI built for it yet
// (integrations/google_drive_accounts tables exist, nothing consumes them).

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!instance) instance = new SupabaseStorageProvider();
  return instance;
}
