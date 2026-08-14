import { describe, expect, it, vi, beforeEach } from 'vitest';

const invoke = vi.fn(() => Promise.resolve({ data: 'ok', error: null }));
const signOut = vi.fn(() => Promise.resolve({ error: null }));
const updateUser = vi.fn(() => Promise.resolve({ error: null }));
const resetPasswordForEmail = vi.fn(() => Promise.resolve({ error: null }));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: { invoke },
    auth: { signOut, updateUser, resetPasswordForEmail },
    from: () => ({ select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
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

describe('auth adapter surface used by the auth pages', () => {
  beforeEach(() => {
    signOut.mockClear();
    updateUser.mockClear();
    resetPasswordForEmail.mockClear();
  });

  it('exposes forgotPassword, which ForgotPassword calls', async () => {
    await base44.auth.forgotPassword('someone@example.com');
    expect(resetPasswordForEmail).toHaveBeenCalledWith('someone@example.com');
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
