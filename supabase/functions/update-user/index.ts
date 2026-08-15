import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  authorizeProfileUpdate,
  warnOnProtectedIdentityDrift,
} from '../_shared/permissions.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Forms send '' for an unset optional value; Postgres rejects that on date and uuid
 * columns. `src/api/base44Client.js` normalises the same way for direct PostgREST
 * writes, and profile saves that route through this function need the same treatment.
 */
function nullifyEmptyStrings(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, value === '' ? null : value]),
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Server is not configured for profile update operations.');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authUser, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser.user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { targetUserId, updates } = await req.json();
    if (!targetUserId) {
      return json({ error: 'targetUserId is required.' }, 400);
    }

    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, role, email');
    if (profilesError) throw profilesError;

    warnOnProtectedIdentityDrift(profiles ?? [], { requirePresence: true });

    const callerProfile = (profiles ?? []).find((p) => p.id === authUser.user.id);
    const targetProfile = (profiles ?? []).find((p) => p.id === targetUserId);

    if (!callerProfile) {
      return json({ error: 'Forbidden' }, 403);
    }

    const decision = authorizeProfileUpdate(callerProfile, targetProfile, updates ?? {}, profiles ?? []);
    if (!decision.ok) {
      return json({ error: decision.error }, decision.status);
    }

    const { data: updated, error: updateError } = await adminClient
      .from('profiles')
      .update(nullifyEmptyStrings(updates))
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      return json({ error: updateError.message || 'Failed to update profile' }, 400);
    }

    return json(updated, 200);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
