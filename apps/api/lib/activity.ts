import { admin } from './supabase-admin';

/**
 * Fire-and-forget activity log entry — powers user_analytics_summary()'s
 * 7-day activity chart. Never throws into the caller; a logging failure
 * shouldn't fail the mutation that triggered it.
 */
export async function logActivity(
  profileId: string,
  action: string,
  resourceType: 'file' | 'note' | 'folder' | 'assistant',
  resourceId?: string,
  metadata?: Record<string, unknown>,
) {
  const { error } = await admin
    .from('activity_logs')
    .insert({ user_id: profileId, action, resource_type: resourceType, resource_id: resourceId, metadata });
  if (error) console.error('[activity] failed to log', action, error.message);
}
