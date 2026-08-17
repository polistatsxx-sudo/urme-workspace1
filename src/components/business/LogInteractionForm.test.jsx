import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const contactFilter = vi.fn(() => Promise.resolve([]));
const templateList = vi.fn(() => Promise.resolve([]));
const templateUpdate = vi.fn(() => Promise.resolve({}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Contact: { filter: (...args) => contactFilter(...args), create: vi.fn() },
      EmailTemplate: { list: (...args) => templateList(...args), update: (...args) => templateUpdate(...args) },
    },
    integrations: { Core: { UploadFile: vi.fn() } },
  },
}));

vi.mock('@/components/shared/RichTextEditor', () => ({ default: () => <div /> }));

beforeAll(() => {
  // Radix's select popper leans on a few APIs jsdom does not implement.
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
});

async function renderForm({ contacts = [], templates = [], bizContactName, bizContactTitle } = {}) {
  contactFilter.mockResolvedValue(contacts);
  templateList.mockResolvedValue(templates);
  const onSubmit = vi.fn();
  const { default: LogInteractionForm } = await import('@/components/business/LogInteractionForm');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <LogInteractionForm
        onSubmit={onSubmit}
        saving={false}
        bizId="biz-1"
        bizName="Acme"
        bizContactName={bizContactName}
        bizContactTitle={bizContactTitle}
      />
    </QueryClientProvider>
  );

  return { onSubmit };
}

function openContactPicker() {
  const trigger = screen
    .getAllByRole('combobox')
    .find(el => el.textContent.includes('Select a contact'));
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  return trigger;
}

const option = (name) => screen.findByRole('option', { name });

describe('Log Interaction contact picker', () => {
  beforeEach(() => {
    vi.resetModules();
    contactFilter.mockClear();
    templateList.mockClear();
    templateUpdate.mockClear();
  });

  afterEach(cleanup);

  it('offers the business primary contact when the business record names one', async () => {
    await renderForm({ bizContactName: 'Michael', bizContactTitle: 'CEO' });
    openContactPicker();

    expect(await option('No contact')).toBeTruthy();
    expect(await option('Michael · CEO (primary contact)')).toBeTruthy();
  });

  it('does not offer it when the business has no primary contact', async () => {
    await renderForm({});
    openContactPicker();

    expect(await option('No contact')).toBeTruthy();
    expect(screen.queryByRole('option', { name: /primary contact/ })).toBeNull();
  });

  it('logs the primary contact by name with no contact_id, since it is not a Contact row', async () => {
    const { onSubmit } = await renderForm({ bizContactName: 'Michael' });
    openContactPicker();

    fireEvent.click(await option('Michael (primary contact)'));
    fireEvent.click(screen.getByRole('button', { name: 'Log Interaction' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [payload] = onSubmit.mock.calls[0];
    expect(payload.contact_name).toBe('Michael');
    // '' is what the adapter normalises to null; a fabricated uuid would break the insert.
    expect(payload.contact_id).toBe('');
  });

  it('still logs a real Contact with its id and name', async () => {
    const { onSubmit } = await renderForm({
      contacts: [{ id: 'c-1', full_name: 'Dana Reed', title: 'COO' }],
    });
    openContactPicker();

    fireEvent.click(await option('Dana Reed · COO'));
    fireEvent.click(screen.getByRole('button', { name: 'Log Interaction' }));

    const [payload] = onSubmit.mock.calls[0];
    expect(payload.contact_id).toBe('c-1');
    expect(payload.contact_name).toBe('Dana Reed');
  });

  it('suppresses the primary-contact option when a Contact row already has that name', async () => {
    await renderForm({
      bizContactName: 'Michael',
      contacts: [{ id: 'c-1', full_name: 'michael' }],
    });
    openContactPicker();

    expect(await option('michael')).toBeTruthy();
    expect(screen.queryByRole('option', { name: /primary contact/ })).toBeNull();
  });
});

describe('Log Interaction template use count', () => {
  beforeEach(() => {
    vi.resetModules();
    contactFilter.mockClear();
    templateList.mockClear();
    templateUpdate.mockClear();
  });

  afterEach(cleanup);

  it('counts a template as used when it is applied to the notes', async () => {
    await renderForm({ templates: [{ id: 't-1', title: 'Follow Up', body: 'Hi {{contact_name}}', use_count: 4 }] });

    fireEvent.click(screen.getByRole('button', { name: /use template/i }));
    fireEvent.click(await screen.findByRole('button', { name: /follow up/i }));

    await waitFor(() => expect(templateUpdate).toHaveBeenCalledWith('t-1', { use_count: 5 }));
  });

  it('starts a template that has never been used at one', async () => {
    await renderForm({ templates: [{ id: 't-2', title: 'Intro', body: 'Hello' }] });

    fireEvent.click(screen.getByRole('button', { name: /use template/i }));
    fireEvent.click(await screen.findByRole('button', { name: /intro/i }));

    await waitFor(() => expect(templateUpdate).toHaveBeenCalledWith('t-2', { use_count: 1 }));
  });

  it('does not count merely opening the template list', async () => {
    await renderForm({ templates: [{ id: 't-1', title: 'Follow Up', body: 'Hi' }] });

    fireEvent.click(screen.getByRole('button', { name: /use template/i }));
    await screen.findByRole('button', { name: /follow up/i });

    expect(templateUpdate).not.toHaveBeenCalled();
  });
});
