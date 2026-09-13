import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

// The live bug: `events.date` is date-only, so it is stored as midnight UTC, which is the
// evening *before* in Denver. isPast(new Date(date)) therefore called today's events past
// and Upcoming sat at 0. TZ is pinned to America/Denver in vitest.config.js; only the Date
// clock is faked, so React Testing Library's own timers keep working.
describe('Event upcoming / archived split', () => {
  // Noon on Sunday 13 September 2026, Denver — mid-afternoon UTC of the same day.
  const denverNoon = new Date('2026-09-13T18:00:00Z');

  const aroundToday = [
    { id: 'ev-today', name: 'Today Mixer', date: '2026-09-13 00:00:00+00', status: 'confirmed', event_type: 'mixer' },
    { id: 'ev-tonight', name: 'Tonight Dinner', date: '2026-09-13 00:00:00+00', time: '6:00 PM', status: 'confirmed', event_type: 'dinner' },
    { id: 'ev-morning', name: 'Morning Briefing', date: '2026-09-13 00:00:00+00', time: '8:00 AM', status: 'completed', event_type: 'workshop' },
    { id: 'ev-yesterday', name: 'Yesterday Workshop', date: '2026-09-12 00:00:00+00', status: 'completed', event_type: 'workshop' },
    { id: 'ev-tomorrow', name: 'Tomorrow Showcase', date: '2026-09-14 00:00:00+00', status: 'planning', event_type: 'showcase' },
    { id: 'ev-undated', name: 'Someday Summit', date: null, status: 'planning', event_type: 'conference' },
  ];

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(denverNoon);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.resetModules();
    eventList.mockClear();
    businessList.mockClear();
  });

  afterEach(cleanup);

  it("files today's events under Upcoming, not Archived", async () => {
    await renderEvents(aroundToday);

    expect(await screen.findByText('Today Mixer')).toBeTruthy();
    expect(screen.getByText('Tonight Dinner')).toBeTruthy();
    expect(screen.getByText('Tomorrow Showcase')).toBeTruthy();
    // Undated events ride along with Upcoming rather than falling out of both tabs.
    expect(screen.getByText('Someday Summit')).toBeTruthy();
    expect(screen.getByText(/Date TBD \(1\)/)).toBeTruthy();

    expect(screen.queryByText('Yesterday Workshop')).toBeNull();
    expect(screen.queryByText('Morning Briefing')).toBeNull();

    expect(screen.getByRole('tab', { name: 'Upcoming (4)' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Archived (2)' })).toBeTruthy();
    expect(screen.getByText('4 upcoming • 2 past')).toBeTruthy();
  });

  it('archives yesterday, and today once its own time has gone by', async () => {
    await renderEvents(aroundToday);
    await screen.findByText('Today Mixer');

    // Radix switches tabs on pointer down, not on click.
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Archived (2)' }));

    expect(await screen.findByText('Yesterday Workshop')).toBeTruthy();
    expect(screen.getByText('Morning Briefing')).toBeTruthy();
    expect(screen.queryByText('Today Mixer')).toBeNull();
    expect(screen.queryByText('Tonight Dinner')).toBeNull();
  });

  it('prints the day that was picked, not the evening before it', async () => {
    await renderEvents([aroundToday[0]]);

    expect(await screen.findByText('Sep 13, 2026')).toBeTruthy();
    expect(screen.queryByText('Sep 12, 2026')).toBeNull();
  });

  it('shows an event whose date is missing instead of dropping it', async () => {
    await renderEvents([{ id: 'ev-undated', name: 'Someday Summit', date: null, status: 'planning' }]);

    expect(await screen.findByText('Someday Summit')).toBeTruthy();
    expect(screen.getAllByText('Date TBD').length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: 'Upcoming (1)' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Archived (0)' })).toBeTruthy();
  });

  it('keeps an unreadable date visible too', async () => {
    await renderEvents([{ id: 'ev-vague', name: 'Vague Retreat', date: 'sometime in the fall', status: 'planning' }]);

    expect(await screen.findByText('Vague Retreat')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Upcoming (1)' })).toBeTruthy();
  });

  it('lists upcoming events soonest first', async () => {
    await renderEvents(aroundToday);
    await screen.findByText('Today Mixer');

    const names = screen.getAllByText(/Mixer|Dinner|Showcase|Summit$/).map(el => el.textContent);
    expect(names).toEqual(['Someday Summit', 'Today Mixer', 'Tonight Dinner', 'Tomorrow Showcase']);
  });
});
