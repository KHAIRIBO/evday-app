export interface StorageProvider {
  createUploadUrl(input: { path: string; mimeType: string }): Promise<{ uploadUrl: string }>;
  createSignedDownloadUrl(path: string): Promise<{ url: string }>;
}

// TODO: wire up supabase.ts (default) and google-drive.ts.
