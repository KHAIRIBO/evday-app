import { NoteRecord, UpdateNoteInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { ApiError, errorResponse, validationError } from '@/lib/errors';
import { getProfileId } from '@/lib/profile';
import { admin } from '@/lib/supabase-admin';

function toRecord(row: Record<string, unknown>) {
  return NoteRecord.parse({
    id: row.id,
    title: row.title,
    content: row.content,
    folderId: row.folder_id,
    isPinned: row.is_pinned,
    isArchived: row.is_archived,
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

    const { data, error } = await admin.from('workspace_notes').select('*').eq('id', id).eq('user_id', profileId).maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Note not found');

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
    const parsed = UpdateNoteInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.title !== undefined) patch.title = parsed.data.title;
    if (parsed.data.content !== undefined) patch.content = parsed.data.content;
    if (parsed.data.folderId !== undefined) patch.folder_id = parsed.data.folderId;
    if (parsed.data.isPinned !== undefined) patch.is_pinned = parsed.data.isPinned;
    if (parsed.data.isArchived !== undefined) patch.is_archived = parsed.data.isArchived;

    const { data, error } = await admin
      .from('workspace_notes')
      .update(patch)
      .eq('id', id)
      .eq('user_id', profileId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Note not found');

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

    const { error, count } = await admin.from('workspace_notes').delete({ count: 'exact' }).eq('id', id).eq('user_id', profileId);
    if (error) throw error;
    if (!count) throw new ApiError(404, 'NOT_FOUND', 'Note not found');

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
