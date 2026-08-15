import { NextResponse } from 'next/server';

// TODO POST — rotate refresh token, issue new 15-min access token.
export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
