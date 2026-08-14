import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Password recovery links arrive as a URL hash (#access_token=...&type=recovery).
    // The client has to parse it, otherwise /reset-password has no session to
    // update the password with. This is the default; it is pinned because the
    // reset flow depends on it.
    detectSessionInUrl: true,
  },
});
