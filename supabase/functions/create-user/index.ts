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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Server is not configured for admin auth operations.');
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authUser, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', authUser.user.id)
      .single();

    if (callerProfileError || !callerProfile || !['ceo', 'admin'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = body.role || 'user';

    if (!fullName || !email || !password) {
      return new Response(JSON.stringify({ error: 'full_name, email, and password are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (role !== 'user') {
      return new Response(JSON.stringify({ error: 'Only user accounts can be created from this endpoint.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: createdAuth, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError || !createdAuth.user) {
      return new Response(JSON.stringify({ error: createUserError?.message || 'Failed to create auth user' }), {
        status: createUserError?.status || 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: profileInsertError } = await adminClient
      .from('profiles')
      .insert({
        id: createdAuth.user.id,
        full_name: fullName,
        email,
        role: 'user',
        failed_login_attempts: 0,
        account_locked: false,
        mfa_enabled: false,
      });

    if (profileInsertError) {
      await adminClient.auth.admin.deleteUser(createdAuth.user.id);
      return new Response(JSON.stringify({ error: profileInsertError.message || 'Failed to create user profile' }), {
        status: profileInsertError.code === '23505' ? 409 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ id: createdAuth.user.id, email }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const status = typeof error?.status === 'number' && error.status >= 400 && error.status < 600
      ? error.status
      : 500;
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
