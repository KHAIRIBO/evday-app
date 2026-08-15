import { NextResponse } from 'next/server';

// TODO POST — run OCR on an uploaded file, return extracted text.
export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
