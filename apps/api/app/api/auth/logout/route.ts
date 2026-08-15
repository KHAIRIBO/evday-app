import { NextResponse } from 'next/server';

// TODO POST — revoke the refresh token.
export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
