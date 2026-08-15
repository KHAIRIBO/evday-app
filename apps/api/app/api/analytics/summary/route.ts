import { NextResponse } from 'next/server';

// TODO GET — admin.rpc('user_analytics_summary', { p_user: user.id }), parsed
// through AnalyticsSummary from @workspace/shared.
export async function GET() {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
