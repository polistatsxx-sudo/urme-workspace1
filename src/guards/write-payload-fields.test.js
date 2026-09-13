/**
 * Guard: every column a form writes exists in the schema-of-record.
 *
 * A column PostgREST does not know about fails the whole write with
 * `400 PGRST204 ("Could not find the '<col>' column of '<table>' in the schema cache")`,
 * which is the failure mode `supabase/migrations/20260814072821_schema_reconciliation.sql`
 * exists to clean up. It is invisible until someone tries to save.
 *
 * How the fields are found:
 *   - Each `base44.entities.<Entity>.create({...})` / `.update(id, {...})` payload is
 *     brace-matched out of the source and its top-level keys collected. The entity at the
 *     call site says which table to check them against, so no wiring is needed.
 *   - A payload that spreads a form's state (`{ ...form, business_id: bizId }`) has its
 *     fields somewhere else. SPREAD_SOURCES says where, and the keys of that object
 *     literal are checked against the same entity.
 *
 * Every spread has to be accounted for: an unregistered one fails, so a new form cannot
 * quietly escape the check.
 */
import { describe, expect, it } from 'vitest';
import { TABLE_MAP, classifyColumn, readSource, schemaOfRecord, sourceFiles } from './schema-of-record.js';

/**
 * Where a spread payload's field names are declared, keyed by
 * `<file>:<entity>:<spread name>` — the entity is part of the key because one page can
 * spread the same variable name into two different tables.
 *
 * The value is `<file> <anchor>`, where `<anchor>` is text the object literal starts at or
 * follows. An anchor that stops matching fails loudly rather than silently checking
 * nothing.
 *
 * @type {Record<string, string>}
 */
const SPREAD_SOURCES = {
  // Log Interaction (business Activity tab). LogInteractionForm owns the state and hands
  // it back through onSubmit, so BusinessDetail spreads a form it never declares.
  'src/pages/BusinessDetail.jsx:Interaction:data':
    'src/components/business/LogInteractionForm.jsx return {',
  // Inline "Add new contact" inside Log Interaction.
  'src/components/business/LogInteractionForm.jsx:Contact:newContact':
    "src/components/business/LogInteractionForm.jsx useState({ full_name: '', title",
  // Add Business (the create path takes BusinessForm's default state, not a row).
  'src/pages/Businesses.jsx:Business:data':
    'src/components/business/BusinessForm.jsx useState(initialData || {',
  // Add Event.
  'src/pages/Events.jsx:Event:d': 'src/components/event/EventForm.jsx const emptyEvent = {',
  // Log Revenue / Log Expense.
  'src/pages/Finance.jsx:FinanceEntry:d':
    'src/components/finance/FinanceEntryForm.jsx const [form, setForm] = useState({',
  // Mark a receivable as paid.
  'src/pages/Finance.jsx:FinanceEntry:data': 'src/pages/Finance.jsx data: { payment_status',
  // New Thread.
  'src/pages/SyncHub.jsx:Discussion:d':
    'src/components/sync/NewThreadDialog.jsx const [form, setForm] = useState({',
  // Unarchive a thread.
  'src/pages/SyncHub.jsx:Discussion:updates': 'src/pages/SyncHub.jsx const updates = {',
  // Add Contact, from the business page and from the Contacts page.
  'src/components/business/ContactsCard.jsx:Contact:form':
    'src/components/business/ContactsCard.jsx const [form, setForm] = useState({',
  'src/pages/Contacts.jsx:Contact:data': 'src/pages/Contacts.jsx const [form, setForm] = useState({',
  // Bulk Log Interaction owns its own state.
  'src/components/business/BulkLogInteractionModal.jsx:Interaction:form':
    'src/components/business/BulkLogInteractionModal.jsx const [form, setForm] = useState({',
  // New Task, and the status toggle on a task card.
  'src/pages/Tasks.jsx:Task:d': 'src/pages/Tasks.jsx const [form, setForm] = useState({',
  'src/pages/Tasks.jsx:Task:data': 'src/pages/Tasks.jsx data: { status',
  // Share an Idea, and edit one.
  'src/pages/Ideas.jsx:Idea:d': 'src/pages/Ideas.jsx const [form, setForm] = useState({',
  'src/pages/Ideas.jsx:Idea:data': 'src/pages/Ideas.jsx setEditForm({ title',
  // Drag a card to another pipeline column.
  'src/pages/Pipeline.jsx:Business:data': 'src/pages/Pipeline.jsx data: { stage',
  // New / edit email template, and the seeded defaults.
  'src/pages/Templates.jsx:EmailTemplate:data':
    'src/pages/Templates.jsx const [form, setForm] = useState({',
  'src/pages/Templates.jsx:EmailTemplate:t': 'src/pages/Templates.jsx const defaultTemplates = [',
  // Payment / branding settings.
  'src/pages/Settings.jsx:AppSettings:entry': "src/pages/Settings.jsx { key: 'payment_link_url'",
  // Edit another member's profile (whitelisted in the dialog), and edit your own.
  'src/components/team/TeamMemberEditDialog.jsx:User:updates':
    'src/components/team/TeamMemberEditDialog.jsx setForm({',
  'src/pages/Profile.jsx:User:form': "src/pages/Profile.jsx useState({ full_name: '', bio",
};

/**
 * Edit forms that seed their state from the database row itself, so the payload is the
 * whole row: every column it has, including `id` and whatever timestamps the table
 * carries, is PATCHed straight back. Nothing static can enumerate those fields, and they
 * are by construction columns that exist.
 *
 * Listed rather than skipped because the round-trip is a real finding — see the footer of
 * `supabase/migrations/20260814072821_schema_reconciliation.sql` — and because a *new*
 * whole-row spread should have to be added here deliberately.
 *
 * @type {Record<string, string>}
 */
const WHOLE_ROW_SPREADS = {
  'src/pages/BusinessDetail.jsx:Business:data':
    'BusinessForm useState(initialData || {...}) — Edit Business seeds from the row',
  'src/pages/ContactProfile.jsx:Contact:data':
    'setForm({ ...contact }) — Edit Contact seeds from the row',
  'src/pages/Events.jsx:Event:data':
    'EventForm toFormState({ ...emptyEvent, ...initialData }) — Edit Event seeds from the row',
};

/**
 * Payloads assembled a field at a time rather than from an object literal, checked by
 * their own assertion below.
 *
 * @type {Record<string, string>}
 */
const ASSEMBLED_PAYLOADS = {
  'src/components/import/CSVImportDialog.jsx:Business:data':
    'built from the fieldOptions column mapping — see the CSV assertion',
};

/**
 * Read the balanced bracketed run that starts at or after `from`.
 *
 * @param {string} text
 * @param {number} from
 * @param {'{' | '[' | '('} opener
 * @returns {string | null}
 */
function balanced(text, from, opener = '{') {
  const closer = { '{': '}', '[': ']', '(': ')' }[opener];
  const open = text.indexOf(opener, from);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const char = text[i];
    if (char === opener) depth++;
    else if (char === closer) {
      depth--;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return null;
}

/**
 * Split an argument list on its top-level commas.
 *
 * @param {string} args text between the call's parentheses, brackets included
 * @returns {string[]}
 */
function splitArgs(args) {
  const inner = args.slice(1, -1);
  const parts = [];
  let depth = 0;
  let quote = '';
  let current = '';
  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    if (quote) {
      current += char;
      if (char === '\\') current += inner[++i] || '';
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if ('{[('.includes(char)) depth++;
    else if ('}])'.includes(char)) depth--;
    else if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Top-level `key:` names and `...spread` names of an object literal. Nested objects,
 * arrays, strings and template literals are skipped, so `{ a: { b: 1 } }` yields `a`.
 *
 * @param {string} literal
 * @returns {{ keys: string[], spreads: string[] }}
 */
function topLevelKeys(literal) {
  const keys = [];
  const spreads = [];
  let depth = 0;
  let i = 0;
  let quote = '';
  while (i < literal.length) {
    const char = literal[i];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = '';
      i++;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      i++;
      continue;
    }
    if (char === '{' || char === '[' || char === '(') depth++;
    else if (char === '}' || char === ']' || char === ')') depth--;
    else if (depth === 1) {
      const rest = literal.slice(i);
      const key = rest.match(/^(?:\.\.\.)?([A-Za-z_$][\w$]*)\s*(:|,|\}|$)/);
      const isStart = /[{,]\s*$/.test(literal.slice(0, i)) || /[{,]\s*(\/\/[^\n]*)?\n\s*$/.test(literal.slice(0, i));
      if (key && isStart) {
        if (rest.startsWith('...')) spreads.push(key[1]);
        else if (key[2] === ':') keys.push(key[1]);
        i += key[0].length - 1;
        continue;
      }
    }
    i++;
  }
  return { keys, spreads };
}

/**
 * @typedef {{ file: string, line: number, entity: string, keys: string[], spreads: string[] }} WriteSite
 */

/** @returns {WriteSite[]} */
function writeSites() {
  /** @type {WriteSite[]} */
  const sites = [];
  const call = new RegExp(
    `base44\\.entities\\.(${Object.keys(TABLE_MAP).join('|')})\\.(create|update)\\(`,
    'g'
  );
  for (const file of sourceFiles()) {
    if (file.startsWith('src/guards/')) continue;
    const contents = readSource(file);
    for (const match of contents.matchAll(call)) {
      const args = balanced(contents, match.index + match[0].length - 1, '(');
      if (!args) continue;
      // create(payload) / update(id, payload): the payload is always the last argument.
      const payload = splitArgs(args).pop() || '';
      const line = contents.slice(0, match.index).split('\n').length;
      /** @type {WriteSite} */
      const site = { file, line, entity: match[1], keys: [], spreads: [] };
      if (payload.startsWith('{')) {
        Object.assign(site, topLevelKeys(payload));
      } else if (/^[A-Za-z_$][\w$]*$/.test(payload)) {
        // The whole payload is a variable, so it behaves like `{ ...payload }`.
        site.spreads = [payload];
      } else {
        // Neither a literal nor a plain variable — nothing to read, so name it so the
        // "every spread has a declared source" assertion forces a decision.
        site.spreads = [payload.replace(/\s+/g, ' ')];
      }
      sites.push(site);
    }
  }
  return sites;
}

/**
 * The field names an object literal named by SPREAD_SOURCES declares.
 *
 * @param {string} descriptor `<file> <anchor text>`
 * @returns {string[]}
 */
function spreadFields(descriptor) {
  const [file, ...anchorParts] = descriptor.split(' ');
  const anchor = anchorParts.join(' ');
  const contents = readSource(file);
  const at = contents.indexOf(anchor);
  if (at === -1) throw new Error(`SPREAD_SOURCES anchor not found: ${descriptor}`);
  const literal = balanced(contents, at);
  if (!literal) throw new Error(`SPREAD_SOURCES literal not found: ${descriptor}`);
  return topLevelKeys(literal).keys;
}

describe('form writes land on columns the schema-of-record has', () => {
  const schema = schemaOfRecord();
  const sites = writeSites();

  it('finds the write sites at all, so a green result means something', () => {
    expect(sites.length).toBeGreaterThan(35);
    expect(sites.some((s) => s.spreads.length > 0)).toBe(true);
    // A payload nobody could parse would make the whole guard vacuous.
    expect(sites.filter((s) => s.keys.length > 0).length).toBeGreaterThan(25);
  });

  it('every spread payload has a declared source', () => {
    const unregistered = sites
      .flatMap((s) => s.spreads.map((name) => ({ ...s, name })))
      .filter(
        (s) =>
          !(`${s.file}:${s.entity}:${s.name}` in SPREAD_SOURCES) &&
          !(`${s.file}:${s.entity}:${s.name}` in WHOLE_ROW_SPREADS) &&
          !(`${s.file}:${s.entity}:${s.name}` in ASSEMBLED_PAYLOADS)
      )
      .map((s) => `${s.file}:${s.line}: spreads "...${s.name}" — add it to SPREAD_SOURCES`);

    expect(unregistered).toEqual([]);
  });

  it('the edit forms that PATCH a whole database row back are the three known ones', () => {
    // Seeding form state from the row means `id` and every timestamp the table carries go
    // back out in the update. Harmless today; it is also why a generated or read-only
    // column added later would break Save on these three forms and nowhere else.
    const wholeRow = sites
      .flatMap((s) => s.spreads.map((name) => `${s.file}:${s.entity}:${name}`))
      .filter((key) => key in WHOLE_ROW_SPREADS);

    expect([...new Set(wholeRow)].sort()).toEqual(Object.keys(WHOLE_ROW_SPREADS).sort());
  });

  it('no column written directly in a payload is missing from the schema-of-record', () => {
    const missing = sites
      .flatMap((s) => s.keys.map((column) => ({ ...s, column })))
      .filter((s) => classifyColumn(schema, TABLE_MAP[s.entity], s.column) === 'missing')
      .map((s) => `${s.file}:${s.line}: ${s.entity}.${s.column} — no such column on ${TABLE_MAP[s.entity]}`);

    expect(missing).toEqual([]);
  });

  it('no column written through a form-state spread is missing from the schema-of-record', () => {
    const missing = sites
      .flatMap((s) => s.spreads.map((name) => ({ ...s, name })))
      .filter((s) => `${s.file}:${s.entity}:${s.name}` in SPREAD_SOURCES)
      .flatMap((s) =>
        spreadFields(SPREAD_SOURCES[`${s.file}:${s.entity}:${s.name}`]).map((column) => ({ ...s, column }))
      )
      .filter((s) => classifyColumn(schema, TABLE_MAP[s.entity], s.column) === 'missing')
      .map(
        (s) =>
          `${s.file}:${s.line}: ${s.entity} <- ...${s.name}.${s.column} ` +
          `(${SPREAD_SOURCES[`${s.file}:${s.entity}:${s.name}`]}) — no such column on ${TABLE_MAP[s.entity]}`
      );

    expect(missing).toEqual([]);
  });

  it('every column the CSV importer can map exists on businesses', () => {
    // The importer builds its payload from a fixed option list rather than a form state
    // object, so it is checked against that list directly.
    const contents = readSource('src/components/import/CSVImportDialog.jsx');
    const options = balanced(contents, contents.indexOf('const fieldOptions'), '[');
    const columns = [...(options || '').matchAll(/value:\s*'([a-z_]+)'/g)].map((m) => m[1]);

    expect(columns.length).toBeGreaterThan(10);
    const missing = columns.filter((c) => classifyColumn(schema, 'businesses', c) === 'missing');
    expect(missing).toEqual([]);
  });
});
