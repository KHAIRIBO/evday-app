import { ConversationRecord, CreateConversationInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { errorResponse, validationError } from '@/lib/errors';
import { getProfileId } from '@/lib/profile';
import { admin } from '@/lib/supabase-admin';

function toRecord(row: Record<string, unknown>) {
  return ConversationRecord.parse({
    id: row.id,
    title: row.title,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);

    const { data, error } = await admin
      .from('ai_conversations')
      .select('*')
      .eq('user_id', profileId)
      .order('updated_at', { ascending: false });
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
    const parsed = CreateConversationInput.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return validationError(parsed.error);

    const { data, error } = await admin
      .from('ai_conversations')
      .insert({ user_id: profileId, title: parsed.data.title ?? null, model: 'claude-sonnet-5' })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ data: toRecord(data) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
