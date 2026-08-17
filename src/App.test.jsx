import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// App pulls in every page, so the two modules that reach outside the app — the Supabase
// client and the adapter over it — are stubbed. Nothing here fetches: the only route under
// test renders static help content.
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      mfa: { getAuthenticatorAssuranceLevel: vi.fn(() => Promise.resolve({ data: null })) },
    },
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) })),
  },
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: new Proxy({}, {
      get: () => ({
        list: vi.fn(() => Promise.resolve([])),
        filter: vi.fn(() => Promise.resolve([])),
        create: vi.fn(() => Promise.resolve({})),
        update: vi.fn(() => Promise.resolve({})),
        delete: vi.fn(() => Promise.resolve()),
      }),
    }),
    auth: { me: vi.fn(() => Promise.resolve(null)), logout: vi.fn(), onAuthStateChange: vi.fn() },
    functions: { invoke: vi.fn(() => Promise.resolve({ data: {} })) },
    integrations: { Core: { InvokeLLM: vi.fn(), UploadFile: vi.fn() } },
  },
}));

// A signed-in admin with active access, so ProtectedRoute and SubscriptionGate — both real
// here — let the route through.
const authValue = {
  user: { id: 'user-1', email: 'admin@example.com', role: 'admin', full_name: 'Test Admin' },
  isAuthenticated: true,
  isMfaVerified: true,
  isLoadingAuth: false,
  isLoadingPublicSettings: false,
  authError: null,
  refreshProfile: vi.fn(() => Promise.resolve()),
  navigateToLogin: vi.fn(),
};

vi.mock('@/lib/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => authValue,
}));

const { default: App } = await import('@/App');

describe('route table in App.jsx', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the How-To Guide at /help for a signed-in member', async () => {
    window.history.pushState({}, '', '/help');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'How-To Guide' })).toBeTruthy();
    expect(screen.getByLabelText('Search help topics')).toBeTruthy();
    // Rendered inside the app shell rather than as a bare page.
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThan(0);
  });

  it('does not fall through to the 404 page for /help', async () => {
    window.history.pushState({}, '', '/help');

    render(<App />);

    await screen.findByRole('heading', { name: 'How-To Guide' });
    expect(screen.queryByText(/page not found/i)).toBeNull();
  });
});
