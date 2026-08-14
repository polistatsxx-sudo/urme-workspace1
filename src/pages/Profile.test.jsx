import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const updateUser = vi.fn(() => Promise.resolve({ id: 'user-1' }));
const refreshProfile = vi.fn(() => Promise.resolve());

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      User: { list: vi.fn(() => Promise.resolve([])), update: updateUser },
      Interaction: { filter: vi.fn(() => Promise.resolve([])) },
      Business: { list: vi.fn(() => Promise.resolve([])) },
      Event: { list: vi.fn(() => Promise.resolve([])) },
    },
    auth: { logout: vi.fn() },
    functions: { invoke: vi.fn(() => Promise.resolve({ data: {} })) },
    integrations: { Core: { UploadFile: vi.fn() } },
  },
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(() => Promise.resolve({ error: null })),
      mfa: {
        enroll: vi.fn(),
        listFactors: vi.fn(),
        unenroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
      },
    },
  },
}));

// Identity-stable, so Profile's "reset the form when the user changes" effect settles.
const authUser = { id: 'user-1', email: 'ceo@example.com', role: 'ceo', full_name: 'Old Name' };

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: authUser, refreshProfile }),
}));

const { default: Profile } = await import('@/pages/Profile');

function renderProfile() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <Profile />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('Profile keeps the auth context in step with the database', () => {
  // vitest runs without globals, so Testing Library's auto-cleanup is not registered.
  afterEach(cleanup);

  beforeEach(() => {
    updateUser.mockClear();
    refreshProfile.mockClear();
  });

  it('refreshes the context profile on mount so the page never renders a stale row', async () => {
    renderProfile();

    await waitFor(() => expect(refreshProfile).toHaveBeenCalledTimes(1));
  });

  it('refreshes the context profile after a successful save', async () => {
    renderProfile();
    await waitFor(() => expect(refreshProfile).toHaveBeenCalledTimes(1));
    refreshProfile.mockClear();

    fireEvent.change(screen.getByDisplayValue('Old Name'), { target: { value: 'New Name' } });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({ full_name: 'New Name' })));
    await waitFor(() => expect(refreshProfile).toHaveBeenCalledTimes(1));
  });
});
