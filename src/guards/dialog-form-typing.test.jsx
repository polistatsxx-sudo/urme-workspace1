/**
 * Guard: every dialog form accepts a whole word into its first text field without
 * swapping the DOM node underneath the caret.
 *
 * This generalises the regression that broke Create Event. `EventForm` was declared inside
 * `Events()`, so every render produced a new component *type*; React unmounted the old
 * subtree and mounted a fresh one after the first keystroke. The character landed, focus
 * did not, and the field looked like it only accepted one letter.
 *
 * Only multi-character typing catches it — a single `fireEvent.change` passes either way —
 * so each case types a real word and then asserts the node is the same object.
 *
 * The last assertion in this file checks the *coverage*: every file that renders a dialog
 * containing a text field is either in the table below or in the documented exclusions, so
 * a new dialog form cannot land without a typing test.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readSource, sourceFiles } from './schema-of-record.js';

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: new Proxy(
      {},
      {
        get: () => ({
          list: vi.fn(() => Promise.resolve([])),
          filter: vi.fn(() => Promise.resolve([])),
          create: vi.fn((record) => Promise.resolve({ id: 'new', ...record })),
          update: vi.fn((id, updates) => Promise.resolve({ id, ...updates })),
          delete: vi.fn(() => Promise.resolve()),
        }),
      }
    ),
    auth: { me: vi.fn(() => Promise.resolve(null)), logout: vi.fn() },
    functions: { invoke: vi.fn(() => Promise.resolve({ data: {} })) },
    integrations: { Core: { InvokeLLM: vi.fn(), UploadFile: vi.fn() } },
  },
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      updateUser: vi.fn(() => Promise.resolve({})),
      mfa: {
        listFactors: vi.fn(() => Promise.resolve({ data: { totp: [] } })),
        getAuthenticatorAssuranceLevel: vi.fn(() => Promise.resolve({ data: null })),
      },
    },
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) })),
  },
}));

const currentUser = { id: 'u-1', full_name: 'Admin One', email: 'admin@example.com', role: 'admin' };

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, refreshProfile: vi.fn(), isLoadingAuth: false, isAuthenticated: true }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'biz-1' }),
  Link: ({ children, ...rest }) => <a {...rest}>{children}</a>,
}));

// Radix and the rich text editor both need browser APIs jsdom does not implement.
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

const businesses = [{ id: 'biz-1', name: 'Acme Supply' }];
const events = [{ id: 'ev-1', name: 'Fall Mixer' }];

/**
 * Each case names the module under test, how to get its first text field on screen, and
 * the word to type. `open` runs after the initial render for a dialog that starts closed.
 *
 * @type {{ name: string, file: string, render: () => Promise<void>, open?: () => Promise<void>, type: string }[]}
 */
const CASES = [
  {
    name: 'Add / Edit Business',
    file: 'src/components/business/BusinessForm.jsx',
    type: 'Borealis Metals',
    render: async () => {
      const { default: BusinessForm } = await import('@/components/business/BusinessForm');
      renderIn(<BusinessForm businesses={businesses} users={[currentUser]} onSubmit={vi.fn()} saving={false} />);
    },
  },
  {
    name: 'Add / Edit Event',
    file: 'src/components/event/EventForm.jsx',
    type: 'Fall Mixer',
    render: async () => {
      const { default: EventForm } = await import('@/components/event/EventForm');
      renderIn(<EventForm businesses={businesses} onSubmit={vi.fn()} saving={false} />);
    },
  },
  {
    name: 'Log Interaction',
    file: 'src/components/business/LogInteractionForm.jsx',
    type: 'Coffee catch-up',
    render: async () => {
      const { default: LogInteractionForm } = await import('@/components/business/LogInteractionForm');
      renderIn(
        <LogInteractionForm bizId="biz-1" bizName="Acme Supply" users={[currentUser]} onSubmit={vi.fn()} saving={false} />
      );
    },
    // Type, Date & Time, then Title: the first plain textbox is Title.
  },
  {
    name: 'Log Revenue / Expense',
    file: 'src/components/finance/FinanceEntryForm.jsx',
    type: 'Sponsorship cheque',
    render: async () => {
      const { default: FinanceEntryForm } = await import('@/components/finance/FinanceEntryForm');
      renderIn(<FinanceEntryForm type="revenue" events={events} businesses={businesses} onSubmit={vi.fn()} saving={false} />);
    },
  },
  {
    name: 'New Thread',
    file: 'src/components/sync/NewThreadDialog.jsx',
    type: 'Partnership ideas',
    render: async () => {
      const { default: NewThreadDialog } = await import('@/components/sync/NewThreadDialog');
      renderIn(
        <NewThreadDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} saving={false} businesses={businesses} events={events} />
      );
    },
  },
  {
    name: 'Add Contact (business page)',
    file: 'src/components/business/ContactsCard.jsx',
    type: 'Dana Whitfield',
    render: async () => {
      const { default: ContactsCard } = await import('@/components/business/ContactsCard');
      renderIn(<ContactsCard bizId="biz-1" bizName="Acme Supply" />);
    },
    open: async () => fireEvent.click(screen.getByRole('button', { name: /add contact/i })),
  },
  {
    name: 'Bulk Log Interaction',
    file: 'src/components/business/BulkLogInteractionModal.jsx',
    type: 'Quarterly sweep',
    render: async () => {
      const { default: BulkLogInteractionModal } = await import('@/components/business/BulkLogInteractionModal');
      renderIn(<BulkLogInteractionModal open onOpenChange={vi.fn()} businesses={businesses} user={currentUser} />);
    },
  },
  {
    name: 'Edit Team Member',
    file: 'src/components/team/TeamMemberEditDialog.jsx',
    type: 'Jordan Reyes',
    render: async () => {
      const { default: TeamMemberEditDialog } = await import('@/components/team/TeamMemberEditDialog');
      renderIn(
        <TeamMemberEditDialog
          member={{ id: 'u-2', full_name: 'Member Two', email: 'two@example.com', role: 'user' }}
          open
          onOpenChange={vi.fn()}
          canEdit
          onSaved={vi.fn()}
        />
      );
    },
  },
  {
    name: 'Link Event (business page)',
    file: 'src/components/business/EventEngagements.jsx',
    type: 'Met at the booth',
    render: async () => {
      const { default: EventEngagements } = await import('@/components/business/EventEngagements');
      renderIn(<EventEngagements bizId="biz-1" />);
    },
    open: async () => fireEvent.click(screen.getByRole('button', { name: /link event/i })),
  },
  {
    name: 'Quick Capture',
    file: 'src/components/shared/QuickCapture.jsx',
    type: 'Call the venue',
    render: async () => {
      const { default: QuickCapture } = await import('@/components/shared/QuickCapture');
      renderIn(<QuickCapture />);
    },
    open: async () => fireEvent.click(screen.getAllByRole('button').slice(-1)[0]),
  },
  {
    name: 'New Task',
    file: 'src/pages/Tasks.jsx',
    type: 'Draft the proposal',
    render: async () => {
      const { default: Tasks } = await import('@/pages/Tasks');
      renderIn(<Tasks />);
    },
    open: async () => fireEvent.click(screen.getByRole('button', { name: /new task/i })),
  },
  {
    name: 'New Idea',
    file: 'src/pages/Ideas.jsx',
    type: 'Quarterly showcase',
    render: async () => {
      const { default: Ideas } = await import('@/pages/Ideas');
      renderIn(<Ideas />);
    },
    open: async () => fireEvent.click(screen.getByRole('button', { name: /new idea/i })),
  },
  {
    name: 'New Email Template',
    file: 'src/pages/Templates.jsx',
    type: 'Warm intro',
    render: async () => {
      const { default: Templates } = await import('@/pages/Templates');
      renderIn(<Templates />);
    },
    open: async () => fireEvent.click(screen.getByRole('button', { name: /new template/i })),
  },
  {
    name: 'Add Contact (Contacts page)',
    file: 'src/pages/Contacts.jsx',
    type: 'Priya Raman',
    render: async () => {
      const { default: Contacts } = await import('@/pages/Contacts');
      renderIn(<Contacts />);
    },
    open: async () => fireEvent.click(screen.getByRole('button', { name: /add contact/i })),
  },
  {
    name: 'Add Business',
    file: 'src/pages/Businesses.jsx',
    type: 'Northwind Trading',
    render: async () => {
      const { default: Businesses } = await import('@/pages/Businesses');
      renderIn(<Businesses />);
    },
    open: async () => fireEvent.click(screen.getByRole('button', { name: /^add business$/i })),
  },
  {
    name: 'Add Team Member (Team page)',
    file: 'src/pages/Team.jsx',
    type: 'Sam Okafor',
    render: async () => {
      const { default: Team } = await import('@/pages/Team');
      renderIn(<Team />);
    },
    // The page renders the trigger twice, once for wide screens and once for narrow.
    open: async () => fireEvent.click(screen.getAllByRole('button', { name: /add team member/i })[0]),
  },
];

function renderIn(element) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
}

/** The first field a person would type into: a plain text input, not a search or a select. */
function firstTextField() {
  const boxes = screen.getAllByRole('textbox');
  return boxes.find((box) => !/search/i.test(box.getAttribute('placeholder') || '')) || boxes[0];
}

describe.each(CASES)('$name keeps its first text field mounted', (testCase) => {
  beforeEach(() => vi.resetModules());
  afterEach(cleanup);

  it(`accepts "${testCase.type}" without replacing the input node`, async () => {
    const user = userEvent.setup();
    await testCase.render();
    if (testCase.open) await testCase.open();

    const field = await vi.waitFor(() => firstTextField());
    field.focus();
    // An edit dialog seeds the field from the row, so start from empty to keep the
    // assertion about the typed word rather than about the seed value.
    if (field.value) await user.clear(field);
    await user.type(field, testCase.type);

    expect(firstTextField()).toBe(field);
    expect(field.value).toBe(testCase.type);
    expect(document.activeElement).toBe(field);
  });
});

describe('typing coverage', () => {
  /**
   * Files that render a text field inside an overlay but are not a form that writes a
   * record, so there is nothing to lose focus in the middle of.
   */
  const EXCLUDED = {
    'src/components/search/GlobalSearch.jsx': 'search box, debounced, no record written',
    'src/components/sync/ThreadView.jsx': 'reply box, covered by src/pages/SyncHub.test.jsx',
    'src/pages/Profile.jsx': 'invite dialog, covered by src/pages/Profile.test.jsx',
    'src/pages/ContactProfile.jsx': 'edit dialog seeded from the row; needs a loaded contact',
  };

  it('every file with a dialog text field has a typing test', () => {
    const withDialogFields = sourceFiles().filter((file) => {
      if (!file.endsWith('.jsx')) return false;
      if (file.startsWith('src/guards/') || file.startsWith('src/components/ui/')) return false;
      const contents = readSource(file);
      const hasOverlay = /<DialogContent|<motion\.div/.test(contents);
      const hasField = /<Input\b|<Textarea\b|<RichTextEditor\b/.test(contents);
      return hasOverlay && hasField;
    });

    expect(withDialogFields.length).toBeGreaterThan(10);
    const uncovered = withDialogFields
      .filter((file) => !CASES.some((c) => c.file === file))
      .filter((file) => !(file in EXCLUDED));

    expect(uncovered).toEqual([]);
  });
});
