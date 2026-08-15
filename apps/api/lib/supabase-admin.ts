import { createClient } from '@supabase/supabase-js';

// Service-role client — server only. Never import this from anything that
// ships to the device. RLS still applies to policies we choose to keep on;
// this client bypasses them, so every query here must scope by user.id itself.
export const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
