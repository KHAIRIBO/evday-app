import { FolderRecord, UpdateFolderInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { ApiError, errorResponse, validationError } from '@/lib/errors';
import { getProfileId } from '@/lib/profile';
import { admin } from '@/lib/supabase-admin';

function toRecord(row: Record<string, unknown>) {
  return FolderRecord.parse({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
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

    const { data, error } = await admin.from('folders').select('*').eq('id', id).eq('user_id', profileId).maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Folder not found');

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
    const parsed = UpdateFolderInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.name !== undefined) patch.name = parsed.data.name;
    if (parsed.data.parentId !== undefined) patch.parent_id = parsed.data.parentId;

    const { data, error } = await admin
      .from('folders')
      .update(patch)
      .eq('id', id)
      .eq('user_id', profileId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Folder not found');

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

    // Child folders cascade-delete; files/notes inside are detached
    // (folder_id -> null) rather than deleted, per the FK definitions.
    const { error, count } = await admin
      .from('folders')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', profileId);
    if (error) throw error;
    if (!count) throw new ApiError(404, 'NOT_FOUND', 'Folder not found');

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
