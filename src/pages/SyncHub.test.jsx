import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const discussionList = vi.fn(() => Promise.resolve([]));
const discussionUpdate = vi.fn(() => Promise.resolve({}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Discussion: { list: (...args) => discussionList(...args), update: (...args) => discussionUpdate(...args), create: vi.fn() },
      Business: { list: vi.fn(() => Promise.resolve([])) },
      Event: { list: vi.fn(() => Promise.resolve([])) },
    },
  },
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-1', role: 'admin', full_name: 'Admin One' } }),
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = () => {};
});

async function renderSyncHub(discussions) {
  discussionList.mockResolvedValue(discussions);
  const { default: SyncHub } = await import('@/pages/SyncHub');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <SyncHub />
    </QueryClientProvider>
  );
}

const thread = (overrides) => ({
  id: 'disc-1',
  title: 'Q4 planning',
  content: 'Where are we?',
  category: 'general',
  author_name: 'Admin One',
  created_date: '2026-08-01T12:00:00+00:00',
  replies: [],
  ...overrides,
});

describe('Sync Hub archiving is reversible', () => {
  beforeEach(() => {
    vi.resetModules();
    discussionList.mockClear();
    discussionUpdate.mockClear();
  });

  afterEach(cleanup);

  it('unarchives a thread archived through the archived column', async () => {
    await renderSyncHub([thread({ archived: true })]);

    fireEvent.click(await screen.findByTitle('Unarchive'));

    await waitFor(() => expect(discussionUpdate).toHaveBeenCalledWith('disc-1', { archived: false }));
  });

  it('gives a legacy thread back a real category, since it lost its own to "archived"', async () => {
    await renderSyncHub([thread({ category: 'archived' })]);

    fireEvent.click(await screen.findByTitle('Unarchive'));

    await waitFor(() => expect(discussionUpdate).toHaveBeenCalledWith('disc-1', {
      archived: false,
      category: 'general',
    }));
  });

  it('still offers Archive, not Unarchive, on a live thread', async () => {
    await renderSyncHub([thread({})]);

    expect(await screen.findByTitle('Archive')).toBeTruthy();
    expect(screen.queryByTitle('Unarchive')).toBeNull();
  });
});
