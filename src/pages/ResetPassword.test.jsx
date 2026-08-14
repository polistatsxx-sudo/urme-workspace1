import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listeners = [];
const unsubscribe = vi.fn();
const onAuthStateChange = vi.fn((callback) => {
  listeners.push(callback);
  return { data: { subscription: { unsubscribe } } };
});
const resetPassword = vi.fn(() => Promise.resolve());

vi.mock('@/api/base44Client', () => ({
  base44: { auth: { onAuthStateChange, resetPassword } },
}));

const { default: ResetPassword } = await import('@/pages/ResetPassword');

const renderPage = () =>
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  );

// The recovery hash is consumed by the Supabase client, which then reports the
// session through onAuthStateChange.
const emit = (event, session) =>
  act(async () => {
    listeners.forEach((callback) => callback(event, session));
  });

function withStubbedLocation(hash) {
  const original = window.location;
  const stub = { hash, href: '/reset-password', origin: 'http://localhost' };
  Object.defineProperty(window, 'location', { value: stub, writable: true, configurable: true });
  return {
    stub,
    restore: () =>
      Object.defineProperty(window, 'location', { value: original, writable: true, configurable: true }),
  };
}

describe('ResetPassword recovery gating', () => {
  // vitest runs without globals, so Testing Library's auto-cleanup is not registered.
  afterEach(cleanup);

  beforeEach(() => {
    listeners.length = 0;
    onAuthStateChange.mockClear();
    resetPassword.mockClear();
    window.location.hash = '';
  });

  it('waits for the client to report a session instead of reading a ?token= param', () => {
    renderPage();

    expect(onAuthStateChange).toHaveBeenCalled();
    expect(screen.queryByLabelText('New Password')).toBeNull();
    expect(screen.queryByText(/invalid reset link/i)).toBeNull();
  });

  it('shows the form once a recovery session exists, and submits the new password', async () => {
    const location = withStubbedLocation('');
    try {
      renderPage();
      await emit('PASSWORD_RECOVERY', { user: { id: 'user-1' } });

      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'sup3r-secret' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'sup3r-secret' } });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => expect(resetPassword).toHaveBeenCalledWith('sup3r-secret'));
      await waitFor(() => expect(location.stub.href).toBe('/login'));
    } finally {
      location.restore();
    }
  });

  it('refuses to submit mismatched passwords', async () => {
    renderPage();
    await emit('PASSWORD_RECOVERY', { user: { id: 'user-1' } });

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'sup3r-secret' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'something-else' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeTruthy());
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('reports an invalid link when the client finds no session in the URL', async () => {
    renderPage();
    await emit('INITIAL_SESSION', null);

    expect(screen.getByText(/invalid reset link/i)).toBeTruthy();
    expect(screen.queryByLabelText('New Password')).toBeNull();
    expect(screen.getByRole('link', { name: /request a new link/i }).getAttribute('href')).toBe(
      '/forgot-password'
    );
  });

  it('surfaces the expired-link error Supabase puts in the hash', () => {
    const location = withStubbedLocation(
      '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    );
    try {
      renderPage();

      expect(screen.getByText('Email link is invalid or has expired')).toBeTruthy();
      expect(onAuthStateChange).not.toHaveBeenCalled();
    } finally {
      location.restore();
    }
  });
});
