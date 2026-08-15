import { CreateFolderInput, FolderRecord } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { errorResponse, validationError } from '@/lib/errors';
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

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const parentId = req.nextUrl.searchParams.get('parentId');

    let q = admin.from('folders').select('*').eq('user_id', profileId).order('name', { ascending: true });
    q = parentId ? q.eq('parent_id', parentId) : q.is('parent_id', null);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ data: data.map(toRecord) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const parsed = CreateFolderInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const { data, error } = await admin
      .from('folders')
      .insert({ user_id: profileId, name: parsed.data.name, parent_id: parsed.data.parentId ?? null })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ data: toRecord(data) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
