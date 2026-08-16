import { createHash, randomBytes, randomInt } from 'node:crypto';

// Node-runtime-only token helpers, split out of lib/auth.ts so that file
// (requireUser, used by the edge-runtime streaming route) stays free of
// node:crypto — the Edge Runtime can't load it. Only the non-streaming
// auth routes (register/login/verify-email/refresh/logout, all plain
// Node.js runtime) import from here.

export function generateRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateEmailCode(): { code: string; hash: string } {
  // crypto.randomInt, not Math.random() — the latter isn't a CSPRNG and
  // has no place generating anything used as a credential, even a
  // short-lived 6-digit one.
  const code = String(randomInt(100000, 1000000));
  return { code, hash: hashToken(code) };
}
