import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const list = vi.fn(() => Promise.resolve([]));
const create = vi.fn((record) => Promise.resolve({ id: `id-${create.mock.calls.length}`, ...record }));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      EmailTemplate: {
        list,
        create,
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: { full_name: 'Test User' } }) }));
vi.mock('@/components/shared/RichTextEditor', () => ({ default: () => <div /> }));
vi.mock('@/components/shared/RichTextDisplay', () => ({ default: () => <div /> }));

function renderTemplates(Templates, client) {
  return render(
    <QueryClientProvider client={client}>
      <Templates />
    </QueryClientProvider>
  );
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('default email template seeding', () => {
  beforeEach(() => {
    vi.resetModules();
    list.mockClear();
    list.mockResolvedValue([]);
    create.mockClear();
  });

  it('seeds the three defaults once, then not again when the page is remounted with a stale empty cache', async () => {
    const { default: Templates } = await import('@/pages/Templates');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const first = renderTemplates(Templates, client);
    await waitFor(() => expect(create).toHaveBeenCalledTimes(3));
    expect(create.mock.calls.map(([record]) => record.title)).toEqual([
      'Introduction',
      'Follow Up',
      'Event Invite',
    ]);

    // Navigate away and back. The cache still holds the empty list it was seeded
    // from, and reads have not caught up with the inserts yet.
    first.unmount();
    renderTemplates(Templates, client);
    await settle();

    expect(create).toHaveBeenCalledTimes(3);
  });

  it('does not seed when templates already exist', async () => {
    list.mockResolvedValue([{ id: 'existing', title: 'Introduction' }]);
    const { default: Templates } = await import('@/pages/Templates');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderTemplates(Templates, client);
    await waitFor(() => expect(list).toHaveBeenCalled());
    await settle();

    expect(create).not.toHaveBeenCalled();
  });
});
