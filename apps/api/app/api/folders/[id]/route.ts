import { NextResponse } from 'next/server';

// TODO GET/PATCH/DELETE — scoped to requireUser(req).id.
export async function GET() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}

export async function PATCH() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
