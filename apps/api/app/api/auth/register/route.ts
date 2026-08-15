import { NextResponse } from 'next/server';

// TODO POST — create user, send verification email.
export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
