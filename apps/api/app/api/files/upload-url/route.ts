import { NextResponse } from 'next/server';

// TODO POST — returns { uploadUrl, storagePath, fileId } for a direct-to-storage PUT.
export async function POST() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
