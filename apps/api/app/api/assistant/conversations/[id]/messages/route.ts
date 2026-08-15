import { NextResponse } from 'next/server';

// TODO POST — streaming assistant reply. See architecture.md for the
// ReadableStream + getAIProvider shape once providers/ai/* is implemented.
export const runtime = 'edge';

export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
