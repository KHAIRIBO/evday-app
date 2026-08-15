import { NextResponse } from 'next/server';

// TODO GET  — list, cursor-paginated, scoped to requireUser(req).id.
// TODO POST — CreateFileInput.safeParse, insert metadata row.
export async function GET() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
