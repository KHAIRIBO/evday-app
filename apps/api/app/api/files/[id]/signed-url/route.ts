import { NextResponse } from 'next/server';

// TODO GET — short-lived signed download URL from Supabase Storage.
export async function GET() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
