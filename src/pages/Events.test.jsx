import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const eventList = vi.fn(() => Promise.resolve([]));
const eventCreate = vi.fn((record) => Promise.resolve({ id: 'ev-new', ...record }));
const eventUpdate = vi.fn((id, updates) => Promise.resolve({ id, ...updates }));
const businessList = vi.fn(() => Promise.resolve([]));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Event: {
        list: (...args) => eventList(...args),
        create: (...args) => eventCreate(...args),
        update: (...args) => eventUpdate(...args),
        delete: vi.fn(),
      },
      Business: { list: (...args) => businessList(...args) },
      User: { list: vi.fn(() => Promise.resolve([])) },
    },
    integrations: { Core: { InvokeLLM: vi.fn() } },
  },
}));

vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u-1', full_name: 'Admin One', role: 'admin' } }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

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

const businesses = [
  { id: 'biz-2', name: 'Borealis Metals' },
  { id: 'biz-1', name: 'Acme Supply' },
];

async function renderEvents(events = []) {
  eventList.mockResolvedValue(events);
  businessList.mockResolvedValue(businesses);
  const { default: Events } = await import('@/pages/Events');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <Events />
    </QueryClientProvider>
  );
}

const nameBox = () => screen.getAllByRole('textbox')[0];
const openCreateForm = async () => {
  fireEvent.click(screen.getByRole('button', { name: /new event/i }));
  await screen.findByRole('checkbox', { name: 'Acme Supply' });
};

describe('Event form typing', () => {
  beforeEach(() => {
    vi.resetModules();
    eventList.mockClear();
    eventCreate.mockClear();
    businessList.mockClear();
  });

  afterEach(cleanup);

  // A form component re-created on every parent render is a *new* element type, so React
  // throws the old input away and mounts a fresh one after the first keystroke: the
  // character lands but focus goes with the discarded node. Typing more than one
  // character is the only thing that catches it — fireEvent.change fires once and passes
  // either way.
  it('keeps the Event Name field mounted and focused while a whole name is typed', async () => {
    const user = userEvent.setup();
    await renderEvents();
    await openCreateForm();

    const nameInput = nameBox();
    nameInput.focus();
    await user.type(nameInput, 'Fall Mixer');

    expect(nameBox()).toBe(nameInput);
    expect(nameInput.value).toBe('Fall Mixer');
    expect(document.activeElement).toBe(nameInput);
  });

  it('keeps the Location field mounted and focused too', async () => {
    const user = userEvent.setup();
    await renderEvents();
    await openCreateForm();

    // Event Name, Description, Time, Location, Objectives — date inputs have no textbox role.
    const locationInput = screen.getAllByRole('textbox')[3];
    locationInput.focus();
    await user.type(locationInput, 'Halifax');

    expect(screen.getAllByRole('textbox')[3]).toBe(locationInput);
    expect(locationInput.value).toBe('Halifax');
    expect(document.activeElement).toBe(locationInput);
  });

  it('ticks and unticks attendees while a typed name is preserved', async () => {
    const user = userEvent.setup();
    await renderEvents();
    await openCreateForm();

    const nameInput = nameBox();
    await user.type(nameInput, 'Spring Social');

    await user.click(screen.getByRole('checkbox', { name: 'Borealis Metals' }));
    await user.click(screen.getByRole('checkbox', { name: 'Acme Supply' }));
    expect(screen.getByText('2 selected')).toBeTruthy();

    await user.click(screen.getByRole('checkbox', { name: 'Borealis Metals' }));
    expect(screen.getByText('1 selected')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Borealis Metals' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('checkbox', { name: 'Acme Supply' }).getAttribute('aria-checked')).toBe('true');

    expect(nameBox().value).toBe('Spring Social');

    await user.click(screen.getByRole('button', { name: /create event/i }));
    await waitFor(() => expect(eventCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Spring Social',
      attendee_business_ids: ['biz-1'],
      attendee_count: 1,
    })));
  });
});

describe('Event attendee picker', () => {
  beforeEach(() => {
    vi.resetModules();
    eventList.mockClear();
    eventCreate.mockClear();
    eventUpdate.mockClear();
    businessList.mockClear();
  });

  afterEach(cleanup);

  it('writes the businesses that were ticked, and keeps the attendee count with them', async () => {
    await renderEvents();

    await openCreateForm();
    // The name box is the first text field in the dialog; labels are not tied to their
    // inputs anywhere in this app.
    fireEvent.change(nameBox(), { target: { value: 'Fall Mixer' } });

    // Alphabetical, not the order the list came back in.
    const options = screen.getAllByRole('checkbox');
    expect(options.map(el => el.getAttribute('aria-label'))).toEqual(['Acme Supply', 'Borealis Metals']);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Borealis Metals' }));
    expect(screen.getByText('1 selected')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => expect(eventCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Fall Mixer',
      attendee_business_ids: ['biz-2'],
      attendee_count: 1,
    })));
  });

  it('starts from the attendees an event already has, and can take one off', async () => {
    await renderEvents([
      {
        id: 'ev-1',
        name: 'Winter Showcase',
        date: '2099-01-15',
        status: 'planning',
        event_type: 'showcase',
        attendee_business_ids: ['biz-1', 'biz-2'],
        attendee_count: 2,
      },
    ]);

    fireEvent.click(await screen.findByRole('button', { name: /edit winter showcase/i }));
    expect(await screen.findByText('2 selected')).toBeTruthy();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Acme Supply' }));
    fireEvent.click(screen.getByRole('button', { name: /update event/i }));

    await waitFor(() => expect(eventUpdate).toHaveBeenCalledWith('ev-1', expect.objectContaining({
      attendee_business_ids: ['biz-2'],
      attendee_count: 1,
    })));
  });

  it('leaves attendees empty when nobody is ticked', async () => {
    await renderEvents();

    await openCreateForm();
    fireEvent.change(nameBox(), { target: { value: 'Quiet Dinner' } });
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => expect(eventCreate).toHaveBeenCalledWith(expect.objectContaining({
      attendee_business_ids: [],
    })));
  });
});
