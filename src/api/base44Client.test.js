import { describe, expect, it, vi, beforeEach } from 'vitest';

const invoke = vi.fn(() => Promise.resolve({ data: 'ok', error: null }));
const signOut = vi.fn(() => Promise.resolve({ error: null }));
const updateUser = vi.fn(() => Promise.resolve({ error: null }));
const resetPasswordForEmail = vi.fn(() => Promise.resolve({ error: null }));
const insert = vi.fn();
const update = vi.fn();

const returning = () => ({ single: () => Promise.resolve({ data: { id: 'row-1' }, error: null }) });

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: { invoke },
    auth: { signOut, updateUser, resetPasswordForEmail },
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      insert: (payload) => {
        insert(payload);
        return { select: returning };
      },
      update: (payload) => {
        update(payload);
        return { eq: () => ({ select: returning }) };
      },
    }),
  },
}));

const { base44 } = await import('@/api/base44Client');

describe('integrations.Core.InvokeLLM', () => {
  beforeEach(() => invoke.mockClear());

  it('forwards model and temperature to the Edge Function', async () => {
    await base44.integrations.Core.InvokeLLM({
      prompt: 'summarise this business',
      response_json_schema: { type: 'object' },
      model: 'grok-3-mini-fast',
      temperature: 0.2,
    });

    expect(invoke).toHaveBeenCalledWith('invoke-llm', {
      body: {
        prompt: 'summarise this business',
        response_json_schema: { type: 'object' },
        model: 'grok-3-mini-fast',
        temperature: 0.2,
      },
    });
  });

  it('still accepts the prompt-only contract', async () => {
    await base44.integrations.Core.InvokeLLM({ prompt: 'hello' });

    const [, options] = invoke.mock.calls[0];
    expect(options.body.prompt).toBe('hello');
    expect(options.body.model).toBeUndefined();
    expect(options.body.temperature).toBeUndefined();
  });
});

describe('entity writes normalise empty strings', () => {
  beforeEach(() => {
    insert.mockClear();
    update.mockClear();
  });

  it('sends null instead of the empty string a form leaves in an unset field', async () => {
    await base44.entities.Business.create({
      name: 'Acme',
      stage: 'lead',
      assigned_to: '',
      website: '',
    });

    expect(insert).toHaveBeenCalledWith({
      name: 'Acme',
      stage: 'lead',
      assigned_to: null,
      website: null,
    });
  });

  it('normalises updates the same way', async () => {
    await base44.entities.Task.update('task-1', { title: 'Call back', due_date: '' });

    expect(update).toHaveBeenCalledWith({ title: 'Call back', due_date: null });
  });

  it('leaves every other value alone, including falsy ones and nested payloads', async () => {
    const record = {
      title: 'Thread',
      pinned: false,
      attendee_count: 0,
      author_name: null,
      replies: [{ text: '', author: 'u1' }],
      metadata: { note: '' },
    };

    await base44.entities.Discussion.create(record);

    expect(insert).toHaveBeenCalledWith(record);
  });
});

describe('auth adapter surface used by the auth pages', () => {
  beforeEach(() => {
    signOut.mockClear();
    updateUser.mockClear();
    resetPasswordForEmail.mockClear();
  });

  it('points recovery emails at the route that can consume the token', async () => {
    await base44.auth.forgotPassword('someone@example.com');
    expect(resetPasswordForEmail).toHaveBeenCalledWith('someone@example.com', {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  });

  it('sends the new password as a string, which ResetPassword now does', async () => {
    await base44.auth.resetPassword('sup3r-secret');
    expect(updateUser).toHaveBeenCalledWith({ password: 'sup3r-secret' });
  });

  it('redirects after logout only when a target is given', async () => {
    // jsdom refuses real navigation, so watch the assignment instead.
    const original = window.location;
    const stub = { href: '/current' };
    Object.defineProperty(window, 'location', { value: stub, writable: true, configurable: true });

    try {
      await base44.auth.logout();
      expect(stub.href).toBe('/current');

      await base44.auth.logout('/login');
      expect(stub.href).toBe('/login');
      expect(signOut).toHaveBeenCalledTimes(2);
    } finally {
      Object.defineProperty(window, 'location', { value: original, writable: true, configurable: true });
    }
  });
});
