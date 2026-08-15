import { jwtVerify, SignJWT } from 'jose';
import type { NextRequest } from 'next/server';

import { ApiError } from './errors';

// Edge-safe on purpose (jose only, no node:crypto) — requireUser is used
// by the assistant streaming route, which runs on the Edge Runtime per
// architecture.md. Token hashing (node:crypto) lives in lib/tokens.ts.

export interface AuthedUser {
  id: string; // auth.users.id — matches profiles.user_id and every user_id FK
}

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 min
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(userId: string): Promise<{ token: string; expiresIn: number }> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
  return { token, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export async function verifyAccessToken(token: string): Promise<AuthedUser> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) throw new Error('missing sub');
    return { id: payload.sub };
  } catch {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired access token');
  }
}

/**
 * Verifies the bearer JWT and returns the authed user. Every route handler
 * must call this instead of trusting a user id from the request body —
 * user.id here comes only from a token this server itself signed.
 */
export async function requireUser(req: NextRequest): Promise<AuthedUser> {
  const header = req.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Missing bearer token');
  return verifyAccessToken(token);
}
