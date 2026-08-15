import { NextResponse } from 'next/server';

// TODO GET/POST — list conversations / start a new one.
export async function GET() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
