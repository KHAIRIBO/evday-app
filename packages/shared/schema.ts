import { z } from 'zod';

// The contract layer. One zod schema validates the request body in the
// Next.js handler (apps/api) and types the mobile client (apps/mobile).
// Change a field here, not in two places.

// ============================================================
// Files
// ============================================================
export const FileRecord = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  folderId: z.string().uuid().nullable(),
  storagePath: z.string(),
  thumbnailUrl: z.string().nullable(),
  isFavorite: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type FileRecordT = z.infer<typeof FileRecord>;

export const CreateFileInput = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  folderId: z.string().uuid().nullable().optional(),
  storagePath: z.string(),
});
export type CreateFileInputT = z.infer<typeof CreateFileInput>;

export const UpdateFileInput = z.object({
  name: z.string().min(1).max(255).optional(),
  folderId: z.string().uuid().nullable().optional(),
  isFavorite: z.boolean().optional(),
});
export type UpdateFileInputT = z.infer<typeof UpdateFileInput>;

export const CreateUploadUrlInput = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
});
export type CreateUploadUrlInputT = z.infer<typeof CreateUploadUrlInput>;

// ============================================================
// Folders
// ============================================================
export const FolderRecord = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type FolderRecordT = z.infer<typeof FolderRecord>;

export const CreateFolderInput = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable().optional(),
});
export type CreateFolderInputT = z.infer<typeof CreateFolderInput>;

export const UpdateFolderInput = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().uuid().nullable().optional(),
});
export type UpdateFolderInputT = z.infer<typeof UpdateFolderInput>;

// ============================================================
// Notes
// ============================================================
export const NoteRecord = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string().nullable(),
  folderId: z.string().uuid().nullable(),
  isPinned: z.boolean(),
  isArchived: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type NoteRecordT = z.infer<typeof NoteRecord>;

export const CreateNoteInput = z.object({
  title: z.string().min(1).max(255).default('Untitled Note'),
  content: z.string().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
});
export type CreateNoteInputT = z.infer<typeof CreateNoteInput>;

export const UpdateNoteInput = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});
export type UpdateNoteInputT = z.infer<typeof UpdateNoteInput>;

// ============================================================
// Analytics
// ============================================================
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

// ============================================================
// Activity — read side of activity_logs (apps/api/lib/activity.ts writes it)
// ============================================================
export const ActivityLogRecord = z.object({
  id: z.string().uuid(),
  action: z.string(),
  resourceType: z.string().nullable(),
  resourceId: z.string().uuid().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().datetime({ offset: true }),
});
export type ActivityLogRecordT = z.infer<typeof ActivityLogRecord>;

// ============================================================
// Auth — passwordless, email-code based (see apps/api/supabase/migrations
// /20260815000100_auth.sql for why: no password field anywhere in the
// mobile UI, passcode/Touch ID are a LOCAL lock on the stored refresh
// token per architecture.md, never sent to the server).
// ============================================================
export const RequestCodeInput = z.object({
  email: z.string().email(),
});
export type RequestCodeInputT = z.infer<typeof RequestCodeInput>;

export const VerifyCodeInput = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/),
});
export type VerifyCodeInputT = z.infer<typeof VerifyCodeInput>;

export const RefreshInput = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInputT = z.infer<typeof RefreshInput>;

export const AuthUser = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});
export type AuthUserT = z.infer<typeof AuthUser>;

export const AuthTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(), // access token TTL in seconds
  user: AuthUser,
});
export type AuthTokensT = z.infer<typeof AuthTokens>;

// ============================================================
// Assistant
// ============================================================
export const ConversationRecord = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  model: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type ConversationRecordT = z.infer<typeof ConversationRecord>;

export const CreateConversationInput = z.object({
  title: z.string().max(255).nullable().optional(),
});
export type CreateConversationInputT = z.infer<typeof CreateConversationInput>;

export const SendMessageInput = z.object({
  message: z.string().min(1),
  attachments: z.array(z.string().uuid()).optional(),
});
export type SendMessageInputT = z.infer<typeof SendMessageInput>;

export const MessageRecord = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
});
export type MessageRecordT = z.infer<typeof MessageRecord>;

// ============================================================
// OCR
// ============================================================
export const OcrProcessInput = z.object({
  fileId: z.string().uuid(),
});
export type OcrProcessInputT = z.infer<typeof OcrProcessInput>;

export const OcrResult = z.object({
  id: z.string().uuid(),
  fileId: z.string().uuid(),
  extractedText: z.string().nullable(),
  processingStatus: z.enum(['pending', 'completed', 'failed']),
  createdAt: z.string().datetime({ offset: true }),
});
export type OcrResultT = z.infer<typeof OcrResult>;
