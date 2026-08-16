import { REFRESH_TOKEN_TTL_SECONDS, signAccessToken } from './auth';
import { sendVerificationCode } from './email';
import { ApiError } from './errors';
import { admin } from './supabase-admin';
import { generateEmailCode, generateRefreshToken, hashToken } from './tokens';

const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODES_PER_HOUR = 5;

/**
 * Register and login are both just "send a code to this email" — the
 * difference is only in what verify-email does once the code comes back
 * (create an account vs. require one already exists). For login we still
 * insert+send only if the account exists, but return the same generic
 * response either way so the endpoint doesn't leak which emails have
 * accounts.
 *
 * Cooldown and hourly cap are enforced here, server-side, against actual
 * rows in email_verifications — not just the mobile UI's 60s countdown,
 * which is a courtesy display, not a security boundary. Anyone can call
 * this endpoint directly.
 */
export async function requestVerificationCode(email: string, purpose: 'register' | 'login') {
  if (purpose === 'login') {
    const { data: profile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
    if (!profile) return;
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data: recent, error: recentErr } = await admin
    .from('email_verifications')
    .select('created_at')
    .eq('email', email)
    .gt('created_at', oneHourAgo)
    .order('created_at', { ascending: false });
  if (recentErr) throw new ApiError(500, 'DB_ERROR', recentErr.message);

  if (recent.length > 0) {
    const secondsSinceLast = (Date.now() - new Date(recent[0].created_at).getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      throw new ApiError(
        429,
        'RESEND_COOLDOWN',
        `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code`,
      );
    }
  }
  if (recent.length >= MAX_CODES_PER_HOUR) {
    throw new ApiError(429, 'RATE_LIMITED', 'Too many verification codes requested — try again in an hour');
  }

  const { code, hash } = generateEmailCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();

  const { error } = await admin.from('email_verifications').insert({
    email,
    purpose,
    code_hash: hash,
    expires_at: expiresAt,
  });
  if (error) throw new ApiError(500, 'DB_ERROR', error.message);

  await sendVerificationCode(email, code, purpose);
}

interface EmailVerificationRow {
  id: string;
  purpose: 'register' | 'login';
  code_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
}

/**
 * Distinguishes expired / wrong-code / too-many-attempts rather than one
 * generic "invalid" for all three — the mobile screen shows a different
 * message for each.
 */
export async function consumeVerificationCode(email: string, code: string): Promise<{ purpose: 'register' | 'login' }> {
  const { data: row, error } = await admin
    .from('email_verifications')
    .select('id, purpose, code_hash, attempts, max_attempts, expires_at')
    .eq('email', email)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<EmailVerificationRow>();

  if (error) throw new ApiError(500, 'DB_ERROR', error.message);
  if (!row) throw new ApiError(400, 'CODE_INVALID', 'No verification code found for this email — request a new one');

  if (new Date(row.expires_at) < new Date()) {
    throw new ApiError(400, 'CODE_EXPIRED', 'This code has expired. Request a new code.');
  }
  if (row.attempts >= row.max_attempts) {
    throw new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts — request a new code');
  }

  if (hashToken(code) !== row.code_hash) {
    await admin.from('email_verifications').update({ attempts: row.attempts + 1 }).eq('id', row.id);
    throw new ApiError(400, 'CODE_INVALID', 'Invalid verification code');
  }

  await admin.from('email_verifications').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);
  return { purpose: row.purpose };
}

export async function issueSession(userId: string) {
  const { token: accessToken, expiresIn } = await signAccessToken(userId);
  const { token: refreshToken, hash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();

  const { error } = await admin.from('auth_sessions').insert({
    user_id: userId,
    refresh_token_hash: hash,
    expires_at: expiresAt,
  });
  if (error) throw new ApiError(500, 'DB_ERROR', error.message);

  return { accessToken, refreshToken, expiresIn };
}
