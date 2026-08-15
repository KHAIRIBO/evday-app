import type { NextRequest } from 'next/server';

export interface AuthedUser {
  id: string;
}

// TODO: verify the JWT (jose, HS256 against JWT_SECRET), read the sub claim,
// throw a 401-shaped error on failure. Every handler must call this instead
// of trusting a user id from the request body.
export async function requireUser(_req: NextRequest): Promise<AuthedUser> {
  throw new Error('requireUser not implemented');
}
