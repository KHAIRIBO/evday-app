import { ProfileRecord, UpdateProfileInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { ApiError, errorResponse, validationError } from '@/lib/errors';
import { admin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const authed = await requireUser(req);

    const { data, error } = await admin
      .from('profiles')
      .select('email, display_name, avatar_url, storage_quota, created_at')
      .eq('user_id', authed.id)
      .single();
    if (error || !data) throw new ApiError(404, 'NOT_FOUND', 'Profile not found');

    return NextResponse.json({
      data: ProfileRecord.parse({
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        storageQuota: data.storage_quota,
        createdAt: data.created_at,
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authed = await requireUser(req);
    const parsed = UpdateProfileInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const { error } = await admin
      .from('profiles')
      .update({ display_name: parsed.data.displayName, updated_at: new Date().toISOString() })
      .eq('user_id', authed.id);
    if (error) throw new ApiError(500, 'DB_ERROR', error.message);

    return NextResponse.json({ data: { message: 'Profile updated' } });
  } catch (error) {
    return errorResponse(error);
  }
}
