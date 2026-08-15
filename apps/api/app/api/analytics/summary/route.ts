import { AnalyticsSummary } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { admin } from '@/lib/supabase-admin';

const PERIODS = new Set(['week', 'month', 'year']);

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const period = req.nextUrl.searchParams.get('period') ?? 'week';
    // user_analytics_summary resolves profiles.id from auth.users.id
    // itself (supabase/migrations/20260815000200_analytics.sql) — no need
    // for getProfileId here.
    const { data, error } = await admin.rpc('user_analytics_summary', {
      p_user: user.id,
      p_period: PERIODS.has(period) ? period : 'week',
    });
    if (error) throw error;

    return NextResponse.json({ data: AnalyticsSummary.parse(data) });
  } catch (error) {
    return errorResponse(error);
  }
}
