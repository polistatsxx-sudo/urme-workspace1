import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MICHAEL_ID } from '@/utils/permissions';

const updateUser = vi.fn(() => Promise.resolve({ id: 'user-1' }));
const userList = vi.fn(() => Promise.resolve([]));
const refreshProfile = vi.fn(() => Promise.resolve());

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      User: { list: (...args) => userList(...args), update: updateUser },
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

describe('Profile team roster', () => {
  afterEach(cleanup);

  beforeEach(() => {
    userList.mockResolvedValue([
      { id: MICHAEL_ID, full_name: 'Michael Alexander', email: 'polistatsxx@gmail.com', role: 'admin' },
      { id: 'user-2', full_name: 'Member Two', email: 'member2@urmeinc.com', role: 'user' },
    ]);
  });

  afterEach(() => userList.mockResolvedValue([]));

  it('lists the super-admin alongside everyone else', async () => {
    renderProfile();

    // Radix Tabs switch on mousedown, not click.
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Team' }));

    expect(await screen.findByText('Michael Alexander')).toBeTruthy();
    expect(screen.getByText('Member Two')).toBeTruthy();
  });

  it('still gates the controls per row, so showing the super-admin grants nothing', async () => {
    renderProfile();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Team' }));
    await screen.findByText('Michael Alexander');

    const row = (name) => screen.getByText(name).closest('div.flex.items-center.justify-between');
    // The signed-in CEO may delete a standard member, but never the super-admin.
    expect(row('Michael Alexander').querySelector('button')).toBeNull();
    expect(row('Member Two').querySelector('button')).not.toBeNull();
  });
});

describe('Profile offers the help entry point', () => {
  afterEach(cleanup);

  it('renders a "HELP Yourself" link pointing at the help page', async () => {
    renderProfile();

    const link = await screen.findByRole('link', { name: /help yourself/i });
    expect(link.getAttribute('href')).toBe('/help');
  });
});
