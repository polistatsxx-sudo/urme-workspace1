/**
 * Guard: a failed write or a failed AI call gives the affordance back and says what
 * happened.
 *
 * Each of these handlers used to `await` without a `catch`. The rejection went nowhere,
 * the busy flag it had set stayed set, and the control that triggered it stayed disabled
 * for the life of the page — so the only way out was a reload, and nothing on screen said
 * why. Two of them start on page load, where there is not even a button to blame.
 *
 * The assertions are deliberately about what a person can see: the control is usable again
 * and an error was surfaced.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const invokeLLM = vi.fn();
const create = vi.fn();
const list = vi.fn(() => Promise.resolve([]));
const filter = vi.fn(() => Promise.resolve([]));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: new Proxy(
      {},
      {
        get: () => ({
          list: (...args) => list(...args),
          filter: (...args) => filter(...args),
          create: (...args) => create(...args),
          update: vi.fn(() => Promise.resolve({})),
          delete: vi.fn(() => Promise.resolve()),
        }),
      }
    ),
    auth: { me: vi.fn(() => Promise.resolve(null)) },
    functions: { invoke: vi.fn(() => Promise.resolve({ data: {} })) },
    integrations: { Core: { InvokeLLM: (...args) => invokeLLM(...args), UploadFile: vi.fn() } },
  },
}));

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
vi.mock('sonner', () => ({ toast, Toaster: () => null }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u-1', full_name: 'Admin One', role: 'admin' },
    refreshProfile: vi.fn(),
    isLoadingAuth: false,
    isAuthenticated: true,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'biz-1' }),
  Link: ({ children, ...rest }) => <a {...rest}>{children}</a>,
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

beforeEach(() => {
  vi.clearAllMocks();
  list.mockResolvedValue([]);
  filter.mockResolvedValue([]);
  create.mockResolvedValue({ id: 'new' });
  invokeLLM.mockResolvedValue({});
});

afterEach(cleanup);

function renderIn(element) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
}

describe('Quick Capture', () => {
  it('re-enables Capture and reports the failure when the write is rejected', async () => {
    create.mockRejectedValue(new Error('permission denied for table tasks'));
    const { default: QuickCapture } = await import('@/components/shared/QuickCapture');
    renderIn(<QuickCapture />);

    fireEvent.click(screen.getAllByRole('button').slice(-1)[0]);
    fireEvent.change(screen.getByPlaceholderText(/what needs to be done/i), {
      target: { value: 'Call the venue' },
    });
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('permission denied for table tasks'));
    expect(toast.success).not.toHaveBeenCalled();
    // Still open, still holding what was typed, and clickable again.
    expect(screen.getByRole('button', { name: /capture/i }).disabled).toBe(false);
    expect(screen.getByPlaceholderText(/what needs to be done/i).value).toBe('Call the venue');
  });
});

describe('AI Acquisition Strategy', () => {
  it('replaces the spinner with the reason when generation fails on page load', async () => {
    filter.mockImplementation((f) =>
      Promise.resolve(f?.id ? [{ id: 'biz-1', name: 'Acme Supply', stage: 'new_lead' }] : [])
    );
    invokeLLM.mockRejectedValue(new Error('Rate limit reached'));

    const { default: BusinessStrategy } = await import('@/pages/BusinessStrategy');
    renderIn(<BusinessStrategy />);

    expect(await screen.findByText('Rate limit reached')).toBeTruthy();
    expect(screen.queryByText(/analyzing business context/i)).toBeNull();
    expect(screen.getByRole('button', { name: /try again/i }).disabled).toBe(false);
  });
});

describe('Task AI Coach', () => {
  it('gives the composer back when the opening message fails', async () => {
    window.history.replaceState({}, '', '/task-ai-chat?title=Draft%20the%20proposal');
    invokeLLM.mockRejectedValue(new Error('upstream provider error'));

    const { default: TaskAIChat } = await import('@/pages/TaskAIChat');
    renderIn(<TaskAIChat />);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('upstream provider error'));
    expect(screen.getByPlaceholderText(/ask about this task/i).disabled).toBe(false);
  });

  it('gives the composer back when a reply fails', async () => {
    window.history.replaceState({}, '', '/task-ai-chat');
    const { default: TaskAIChat } = await import('@/pages/TaskAIChat');
    renderIn(<TaskAIChat />);

    invokeLLM.mockRejectedValue(new Error('upstream provider error'));
    const composer = screen.getByPlaceholderText(/ask about this task/i);
    fireEvent.change(composer, { target: { value: 'How do I start?' } });
    fireEvent.keyDown(composer, { key: 'Enter' });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('upstream provider error'));
    expect(screen.getByPlaceholderText(/ask about this task/i).disabled).toBe(false);
  });
});

describe('Synergy Scanner', () => {
  const two = [
    { id: 'b-1', name: 'Acme Supply', stage: 'new_lead' },
    { id: 'b-2', name: 'Borealis Metals', stage: 'new_lead' },
  ];

  it('re-enables the button and reports the failure when the scan is rejected', async () => {
    list.mockResolvedValue(two);
    invokeLLM.mockRejectedValue(new Error('Rate limit reached'));

    const { default: Businesses } = await import('@/pages/Businesses');
    renderIn(<Businesses />);

    await screen.findByText('Borealis Metals');
    fireEvent.click(screen.getByRole('button', { name: /synergy scanner/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Rate limit reached'));
    expect(screen.getByRole('button', { name: /synergy scanner/i }).disabled).toBe(false);
  });

  it('says so when the scan produces no usable pairs, instead of finishing silently', async () => {
    list.mockResolvedValue(two);
    // A pair naming a business that is not in the list cannot be saved.
    invokeLLM.mockResolvedValue({
      matches: [{ business_a: 'Someone Else', business_b: 'Also Missing', synergy_score: 90 }],
    });

    const { default: Businesses } = await import('@/pages/Businesses');
    renderIn(<Businesses />);

    await screen.findByText('Borealis Metals');
    fireEvent.click(screen.getByRole('button', { name: /synergy scanner/i }));

    await waitFor(() => expect(toast.info).toHaveBeenCalled());
    expect(create).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('counts the matches it saved, not the ones the model proposed', async () => {
    list.mockResolvedValue(two);
    invokeLLM.mockResolvedValue({
      matches: [
        { business_a: 'Acme', business_b: 'Borealis', synergy_score: 90, reason: 'complementary' },
        { business_a: 'Nobody', business_b: 'Borealis', synergy_score: 80, reason: 'n/a' },
      ],
    });

    const { default: Businesses } = await import('@/pages/Businesses');
    renderIn(<Businesses />);

    await screen.findByText('Borealis Metals');
    fireEvent.click(screen.getByRole('button', { name: /synergy scanner/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Found 1 potential match!'));
    expect(create).toHaveBeenCalledTimes(1);
  });
});
