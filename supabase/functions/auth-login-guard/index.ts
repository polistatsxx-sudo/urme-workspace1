import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Server is not configured for lockout operations.');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { action, email } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, failed_login_attempts, account_locked, mfa_enabled')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ account_locked: false, mfa_enabled: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'precheck') {
      return new Response(JSON.stringify({
        account_locked: !!profile.account_locked,
        failed_login_attempts: profile.failed_login_attempts || 0,
        mfa_enabled: !!profile.mfa_enabled,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'failed') {
      const nextAttempts = Math.min((profile.failed_login_attempts || 0) + 1, 3);
      const lock = nextAttempts >= 3;
      await adminClient
        .from('profiles')
        .update({ failed_login_attempts: nextAttempts, account_locked: lock })
        .eq('id', profile.id);

      return new Response(JSON.stringify({
        failed_login_attempts: nextAttempts,
        account_locked: lock,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'success') {
      await adminClient
        .from('profiles')
        .update({ failed_login_attempts: 0, account_locked: false })
        .eq('id', profile.id);

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
