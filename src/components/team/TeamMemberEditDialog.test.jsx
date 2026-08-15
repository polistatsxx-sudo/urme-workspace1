import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AJ_ID, MICHAEL_ID } from '@/utils/permissions';

const updateUser = vi.fn(() => Promise.resolve({ id: 'user-1' }));
const invoke = vi.fn(() => Promise.resolve({ data: {} }));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: { User: { update: updateUser } },
    functions: { invoke },
    integrations: { Core: { UploadFile: vi.fn() } },
  },
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { auth: { updateUser: vi.fn(() => Promise.resolve({ error: null })) } },
}));

let currentUser = { id: MICHAEL_ID, role: 'admin', email: 'polistatsxx@gmail.com' };

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

const { default: TeamMemberEditDialog } = await import('@/components/team/TeamMemberEditDialog');

const member = { id: 'user-1', role: 'user', email: 'member@urmeinc.com', full_name: 'Member One' };
const aj = { id: AJ_ID, role: 'ceo', email: 'macecnc@urmeinc.com', full_name: 'AJ Macedonia' };

function renderDialog(target) {
  return render(
    <TeamMemberEditDialog member={target} open onOpenChange={() => {}} canEdit onSaved={() => {}} />
  );
}

describe('TeamMemberEditDialog routes writes through the authorized path', () => {
  // vitest runs without globals, so Testing Library's auto-cleanup is not registered.
  afterEach(cleanup);

  beforeEach(() => {
    updateUser.mockClear();
    invoke.mockClear();
    currentUser = { id: MICHAEL_ID, role: 'admin', email: 'polistatsxx@gmail.com' };
  });

  it('saves another member through the update-user function, never PostgREST', async () => {
    renderDialog(member);

    fireEvent.change(screen.getByDisplayValue('Member One'), { target: { value: 'Renamed Member' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(invoke).toHaveBeenCalledWith('update-user', {
      targetUserId: 'user-1',
      updates: expect.objectContaining({ display_name: 'Renamed Member' }),
    }));
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('saves your own profile on the direct self-service path', async () => {
    currentUser = { ...member };
    currentUser.role = 'ceo';
    renderDialog({ ...member, role: 'ceo' });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith('user-1', expect.any(Object)));
    expect(invoke).not.toHaveBeenCalled();
  });

  it('offers subscription management only to a caller who can manage the target', () => {
    renderDialog(member);
    expect(screen.getByText('Subscription Management')).toBeTruthy();
    cleanup();

    currentUser = { id: 'admin-2', role: 'admin', email: 'admin2@urmeinc.com' };
    renderDialog({ ...member, id: AJ_ID, role: 'user' });
    expect(screen.queryByText('Subscription Management')).toBeNull();
  });

  it('refuses to save a profile the caller may not edit, even if the dialog is forced open', async () => {
    currentUser = { id: 'admin-2', role: 'admin', email: 'admin2@urmeinc.com' };
    renderDialog(aj);

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(invoke).not.toHaveBeenCalled());
    expect(updateUser).not.toHaveBeenCalled();
  });
});
