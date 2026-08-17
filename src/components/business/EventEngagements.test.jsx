import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const eventList = vi.fn(() => Promise.resolve([]));
const eventUpdate = vi.fn(() => Promise.resolve({}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: { Event: { list: (...args) => eventList(...args), update: (...args) => eventUpdate(...args) } },
  },
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
});

async function renderEngagements(events) {
  eventList.mockResolvedValue(events);
  const { default: EventEngagements } = await import('@/components/business/EventEngagements');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <EventEngagements bizId="biz-1" />
    </QueryClientProvider>
  );
}

describe('Event engagements can be undone', () => {
  beforeEach(() => {
    vi.resetModules();
    eventList.mockClear();
    eventUpdate.mockClear();
  });

  afterEach(cleanup);

  it('takes the business back off the event it was linked to', async () => {
    await renderEngagements([
      { id: 'ev-1', name: 'Fall Mixer', status: 'confirmed', attendee_business_ids: ['biz-1', 'biz-2'], attendee_count: 2 },
    ]);

    fireEvent.click(await screen.findByLabelText('Unlink from Fall Mixer'));

    await waitFor(() => expect(eventUpdate).toHaveBeenCalledWith('ev-1', {
      attendee_business_ids: ['biz-2'],
      attendee_count: 1,
    }));
  });

  it('never drives the attendee count below zero', async () => {
    await renderEngagements([
      { id: 'ev-1', name: 'Fall Mixer', attendee_business_ids: ['biz-1'] },
    ]);

    fireEvent.click(await screen.findByLabelText('Unlink from Fall Mixer'));

    await waitFor(() => expect(eventUpdate).toHaveBeenCalledWith('ev-1', {
      attendee_business_ids: [],
      attendee_count: 0,
    }));
  });

  it('offers nothing to unlink for an event the business is not on', async () => {
    await renderEngagements([{ id: 'ev-2', name: 'Winter Showcase', attendee_business_ids: ['biz-9'] }]);

    await screen.findByText('Not participating in any events yet.');
    expect(screen.queryByLabelText('Unlink from Winter Showcase')).toBeNull();
  });
});
