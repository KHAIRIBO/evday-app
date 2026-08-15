import { CreateNoteInput, NoteRecord } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { errorResponse, validationError } from '@/lib/errors';
import { logActivity } from '@/lib/activity';
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

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const cursor = req.nextUrl.searchParams.get('cursor');
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 30);

    let q = admin
      .from('workspace_notes')
      .select('*')
      .eq('user_id', profileId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (cursor) q = q.lt('updated_at', cursor);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({
      data: data.map(toRecord),
      nextCursor: data.length === limit ? data[data.length - 1].updated_at : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const parsed = CreateNoteInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const { data, error } = await admin
      .from('workspace_notes')
      .insert({
        user_id: profileId,
        title: parsed.data.title,
        content: parsed.data.content ?? null,
        folder_id: parsed.data.folderId ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    await logActivity(profileId, 'note_created', 'note', data.id);
    return NextResponse.json({ data: toRecord(data) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
