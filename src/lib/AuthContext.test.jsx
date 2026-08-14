import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const session = { user: { id: 'user-1' } };
const getSession = vi.fn(() => Promise.resolve({ data: { session } }));
const getUser = vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1', email: 'ceo@example.com' } } }));
const getAuthenticatorAssuranceLevel = vi.fn(() => Promise.resolve({ data: { currentLevel: 'aal1' } }));
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));

let profileName = 'Old Name';
const single = vi.fn(() => Promise.resolve({ data: { id: 'user-1', full_name: profileName } }));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getSession, getUser, onAuthStateChange, mfa: { getAuthenticatorAssuranceLevel } },
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  },
}));

const { AuthProvider, useAuth } = await import('@/lib/AuthContext');

const seen = [];

function Probe() {
  const { user, refreshProfile } = useAuth();
  seen.push(refreshProfile);
  return <p>{user?.full_name || 'no profile'}</p>;
}

describe('AuthContext.refreshProfile', () => {
  afterEach(cleanup);

  it('keeps one identity across profile reloads, so it is safe as an effect dependency', async () => {
    seen.length = 0;

    const view = await act(async () =>
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      )
    );

    expect(view.getByText('Old Name')).toBeTruthy();
    expect(seen.length).toBeGreaterThan(1);
    expect(new Set(seen).size).toBe(1);

    // A write landed elsewhere; refreshing has to pick it up without remounting.
    profileName = 'New Name';
    await act(async () => {
      await seen[0]();
    });

    expect(view.getByText('New Name')).toBeTruthy();
    expect(new Set(seen).size).toBe(1);
  });
});
