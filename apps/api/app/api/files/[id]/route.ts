import { FileRecord, UpdateFileInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { logActivity } from '@/lib/activity';
import { requireUser } from '@/lib/auth';
import { ApiError, errorResponse, validationError } from '@/lib/errors';
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

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const { id } = await params;

    const { data, error } = await admin
      .from('workspace_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', profileId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'File not found');

    return NextResponse.json({ data: toRecord(data) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const { id } = await params;
    const parsed = UpdateFileInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.name !== undefined) patch.name = parsed.data.name;
    if (parsed.data.folderId !== undefined) patch.folder_id = parsed.data.folderId;
    if (parsed.data.isFavorite !== undefined) patch.is_favorite = parsed.data.isFavorite;

    const { data, error } = await admin
      .from('workspace_files')
      .update(patch)
      .eq('id', id)
      .eq('user_id', profileId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'File not found');

    return NextResponse.json({ data: toRecord(data) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const { id } = await params;

    // Soft delete — matches the GET /api/files is_deleted filter and gives
    // the mobile app's "trash" concept somewhere to read from later.
    const { data, error } = await admin
      .from('workspace_files')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', profileId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'File not found');

    await logActivity(profileId, 'file_delete', 'file', id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
