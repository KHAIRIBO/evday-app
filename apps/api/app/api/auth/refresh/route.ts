import { AuthTokens, RefreshInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { REFRESH_TOKEN_TTL_SECONDS, signAccessToken } from '@/lib/auth';
import { ApiError, errorResponse, validationError } from '@/lib/errors';
import { admin } from '@/lib/supabase-admin';
import { generateRefreshToken, hashToken } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  try {
    const parsed = RefreshInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const hash = hashToken(parsed.data.refreshToken);
    const { data: session, error } = await admin
      .from('auth_sessions')
      .select('id, user_id, revoked_at, expires_at')
      .eq('refresh_token_hash', hash)
      .maybeSingle();

    if (error) throw new ApiError(500, 'DB_ERROR', error.message);
    if (!session) throw new ApiError(401, 'UNAUTHORIZED', 'Invalid refresh token');

    if (session.revoked_at) {
      // This exact refresh token was already rotated away once — someone
      // (or something) is replaying an old token. Kill every active
      // session for this user rather than just this one.
      await admin
        .from('auth_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', session.user_id)
        .is('revoked_at', null);
      throw new ApiError(401, 'UNAUTHORIZED', 'Refresh token reuse detected — all sessions revoked');
    }
    if (new Date(session.expires_at) < new Date()) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Refresh token expired');
    }

    const { token: newRefreshToken, hash: newHash } = generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();

    const { data: newSession, error: insertErr } = await admin
      .from('auth_sessions')
      .insert({ user_id: session.user_id, refresh_token_hash: newHash, expires_at: newExpiresAt })
      .select('id')
      .single();
    if (insertErr) throw new ApiError(500, 'DB_ERROR', insertErr.message);

    await admin
      .from('auth_sessions')
      .update({ revoked_at: new Date().toISOString(), replaced_by: newSession.id })
      .eq('id', session.id);

    const { token: accessToken, expiresIn } = await signAccessToken(session.user_id);
    const { data: profile } = await admin.from('profiles').select('email').eq('user_id', session.user_id).maybeSingle();

    const body = AuthTokens.parse({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      user: { id: session.user_id, email: profile?.email ?? '' },
    });
    return NextResponse.json({ data: body });
  } catch (error) {
    return errorResponse(error);
  }
}
