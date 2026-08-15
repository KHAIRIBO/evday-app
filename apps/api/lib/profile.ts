import { ApiError } from './errors';
import { admin } from './supabase-admin';

/**
 * Every user_id FK in the product schema (folders, workspace_files,
 * workspace_notes, ...) points at profiles.id, not auth.users.id — but
 * requireUser(req) returns the JWT's `sub`, which is auth.users.id. Every
 * data route needs this to go from one to the other.
 */
export async function getProfileId(authUserId: string): Promise<string> {
  const { data, error } = await admin.from('profiles').select('id').eq('user_id', authUserId).maybeSingle();
  if (error) throw new ApiError(500, 'DB_ERROR', error.message);
  if (!data) throw new ApiError(404, 'PROFILE_NOT_FOUND', 'No profile for this account');
  return data.id;
}
