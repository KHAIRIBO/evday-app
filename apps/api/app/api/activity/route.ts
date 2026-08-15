import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { getProfileId } from '@/lib/profile';
import { admin } from '@/lib/supabase-admin';

// No entry in the architecture.md route table — activity_logs had a write
// path (lib/activity.ts) but nothing ever read it back. The home screen's
// "Today / Yesterday" feed needs a real source; this is it.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 20);

    const { data, error } = await admin
      .from('activity_logs')
      .select('id, action, resource_type, resource_id, metadata, created_at')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    return NextResponse.json({
      data: data.map((row) => ({
        id: row.id,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        metadata: row.metadata,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
