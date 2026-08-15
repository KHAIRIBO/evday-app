import { CreateFileInput, FileRecord } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { logActivity } from '@/lib/activity';
import { requireUser } from '@/lib/auth';
import { errorResponse, validationError } from '@/lib/errors';
import { getProfileId } from '@/lib/profile';
import { admin } from '@/lib/supabase-admin';

function toRecord(row: Record<string, unknown>) {
  return FileRecord.parse({
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    size: row.size,
    folderId: row.folder_id,
    storagePath: row.storage_path,
    thumbnailUrl: row.thumbnail_url,
    isFavorite: row.is_favorite,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const parsed = CreateFileInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const { data, error } = await admin
      .from('workspace_files')
      .insert({
        user_id: profileId,
        name: parsed.data.name,
        mime_type: parsed.data.mimeType,
        size: parsed.data.size,
        folder_id: parsed.data.folderId ?? null,
        storage_path: parsed.data.storagePath,
      })
      .select()
      .single();
    if (error) throw error;

    await logActivity(profileId, 'file_upload', 'file', data.id, { name: data.name, size: data.size });
    return NextResponse.json({ data: toRecord(data) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

// Category filter for the Files screen's chips (All/Images/Docs/Scans).
// "scan" has no dedicated column — it's a real proxy signal instead: a
// file with an ocr_results row came from the scan+OCR pipeline (once that
// exists; today it just means the filter correctly returns nothing).
const DOCUMENT_MIME_OR = 'mime_type.eq.application/pdf,mime_type.like.application/vnd.%,mime_type.eq.text/plain,mime_type.eq.application/msword';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const cursor = req.nextUrl.searchParams.get('cursor');
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 30);
    const folderId = req.nextUrl.searchParams.get('folderId');
    const favoritesOnly = req.nextUrl.searchParams.get('favorite') === 'true';
    const type = req.nextUrl.searchParams.get('type'); // image | document | video | scan
    const search = req.nextUrl.searchParams.get('search');

    let q = admin
      .from('workspace_files')
      .select(type === 'scan' ? '*, ocr_results!inner(id)' : '*')
      .eq('user_id', profileId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) q = q.lt('created_at', cursor);
    if (folderId) q = q.eq('folder_id', folderId);
    if (favoritesOnly) q = q.eq('is_favorite', true);
    if (search) q = q.ilike('name', `%${search}%`);
    if (type === 'image') q = q.like('mime_type', 'image/%');
    else if (type === 'video') q = q.like('mime_type', 'video/%');
    else if (type === 'document') q = q.or(DOCUMENT_MIME_OR);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({
      data: data.map(toRecord),
      nextCursor: data.length === limit ? data[data.length - 1].created_at : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
