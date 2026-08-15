import { NextResponse } from 'next/server';

// TODO POST — issue access + refresh token pair.
export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
