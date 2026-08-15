import { randomUUID } from 'node:crypto';

import { CreateUploadUrlInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { ApiError, errorResponse, validationError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/rate-limit';
import { getStorageProvider } from '@/providers/storage';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const parsed = CreateUploadUrlInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const withinQuota = await checkRateLimit(user.id, 'upload', parsed.data.size);
    if (!withinQuota) throw new ApiError(429, 'RATE_LIMITED', 'Daily upload quota exceeded');

    const fileId = randomUUID();
    // Segment [2] (1-indexed) is auth.uid() — matches the storage RLS
    // policies in supabase/migrations/20260815000000_init.sql, even though
    // the actual upload goes through this signed URL (service role),
    // bypassing RLS. Keeping the convention real means it still works if
    // anything ever accesses storage directly.
    const storagePath = `user/${user.id}/files/${fileId}`;

    const { uploadUrl } = await getStorageProvider().createUploadUrl({
      path: storagePath,
      mimeType: parsed.data.mimeType,
    });

    return NextResponse.json({ data: { uploadUrl, storagePath, fileId } });
  } catch (error) {
    return errorResponse(error);
  }
}
