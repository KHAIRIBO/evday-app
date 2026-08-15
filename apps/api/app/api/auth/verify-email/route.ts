import { AuthTokens, VerifyCodeInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { consumeVerificationCode, issueSession } from '@/lib/auth-flow';
import { ApiError, errorResponse, validationError } from '@/lib/errors';
import { admin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const parsed = VerifyCodeInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const { email, code } = parsed.data;

    const { purpose } = await consumeVerificationCode(email, code);

    const { data: existing } = await admin.from('profiles').select('user_id').eq('email', email).maybeSingle();

    let userId: string;
    if (existing) {
      // Idempotent: a code already consumed once (retry, or a login code
      // used right after register) just signs the existing account in.
      userId = existing.user_id;
    } else {
      if (purpose === 'login') {
        throw new ApiError(404, 'NOT_FOUND', 'No account for this email');
      }
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createErr || !created.user) {
        throw new ApiError(500, 'DB_ERROR', createErr?.message ?? 'Failed to create user');
      }
      userId = created.user.id;

      const { error: profileErr } = await admin.from('profiles').insert({ user_id: userId, email });
      if (profileErr) throw new ApiError(500, 'DB_ERROR', profileErr.message);
      // Default folders (Documents/Photos/Important/Archive) are created
      // by the on_profile_created trigger.
    }

    const session = await issueSession(userId);
    const body = AuthTokens.parse({ ...session, user: { id: userId, email } });
    return NextResponse.json({ data: body });
  } catch (error) {
    return errorResponse(error);
  }
}
