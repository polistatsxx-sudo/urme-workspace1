import React from 'react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { login: vi.fn() },
    functions: { invoke: vi.fn(() => Promise.resolve({ data: {} })) },
  },
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { auth: { mfa: { listFactors: vi.fn(), challenge: vi.fn(), verify: vi.fn() }, signInWithOAuth: vi.fn() } },
}));

const { default: Login } = await import('@/pages/Login');

const SRC = join(process.cwd(), 'src');

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(js|jsx)$/.test(entry) && !/\.test\.(js|jsx)$/.test(entry) ? [full] : [];
  });
}

describe('Login password reset entry point', () => {
  it('offers a forgot-password link that targets the ForgotPassword route', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /forgot password/i });
    expect(link.getAttribute('href')).toBe('/forgot-password');
  });
});

describe('router registration', () => {
  it('every static Link target resolves to a registered route', () => {
    const routes = new Set(
      Array.from(
        readFileSync(join(SRC, 'App.jsx'), 'utf8').matchAll(/path="([^"]+)"/g),
        ([, path]) => path
      )
    );

    const dead = [];
    for (const file of sourceFiles(SRC)) {
      const contents = readFileSync(file, 'utf8');
      for (const [, target] of contents.matchAll(/\sto="(\/[^"${]*)"/g)) {
        if (!routes.has(target)) dead.push(`${file.slice(process.cwd().length + 1)}: ${target}`);
      }
    }

    expect(dead).toEqual([]);
  });
});
