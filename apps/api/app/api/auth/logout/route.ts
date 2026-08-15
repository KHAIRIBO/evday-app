import { RefreshInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { errorResponse, validationError } from '@/lib/errors';
import { admin } from '@/lib/supabase-admin';
import { hashToken } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  try {
    const parsed = RefreshInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    // Presenting the refresh token IS the authorization to revoke it —
    // matches the standard "revoke by presenting the token" model, and
    // still works if the caller's access token already expired (the
    // common shape of a logout request).
    const hash = hashToken(parsed.data.refreshToken);
    await admin.from('auth_sessions').update({ revoked_at: new Date().toISOString() }).eq('refresh_token_hash', hash);

    return NextResponse.json({ data: { message: 'Logged out' } });
  } catch (error) {
    return errorResponse(error);
  }
}
