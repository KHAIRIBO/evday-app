import { NextResponse } from 'next/server';

// TODO POST — 6-digit code, 10-minute TTL, 5 attempts, sent via Resend.
export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
