import { z } from 'zod';

// The contract layer. One zod schema validates the request body in the
// Next.js handler (apps/api) and types the mobile client (apps/mobile).
// Change a field here, not in two places. Fill these in as each resource
// gets built — this file intentionally starts empty of real fields.

export const FileRecord = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  folderId: z.string().uuid().nullable(),
  isFavorite: z.boolean(),
  createdAt: z.string().datetime(),
});
export type FileRecordT = z.infer<typeof FileRecord>;

export const CreateFileInput = FileRecord.pick({
  name: true,
  mimeType: true,
  size: true,
  folderId: true,
});
export type CreateFileInputT = z.infer<typeof CreateFileInput>;

export const AnalyticsSummary = z.object({
  storageUsed: z.number(),
  storageQuota: z.number(),
  breakdown: z.array(z.object({ kind: z.string(), bytes: z.number() })),
  filesThisWeek: z.number(),
  filesDelta: z.number(),
  aiQueries: z.number(),
  aiDelta: z.number(),
  activity: z.array(z.object({ date: z.string(), count: z.number() })),
});
export type AnalyticsSummaryT = z.infer<typeof AnalyticsSummary>;

// TODO: Note, Folder, auth request/response schemas, assistant message
// schemas — add alongside the routes that need them.
