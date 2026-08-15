import { NextResponse } from 'next/server';

// TODO GET/PATCH/DELETE — all scoped to requireUser(req).id, never trust params alone.
export async function GET() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}

export async function PATCH() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
