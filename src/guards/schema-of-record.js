/**
 * The schema-of-record, loaded from the two things in the repo that describe it.
 *
 * There is no `supabase db pull` output in this repo (see AGENTS.md), so "does this
 * column exist" can only be answered from:
 *
 *   1. `base44/entities/*.jsonc` — the pre-migration Base44 entity definitions. Field
 *      names, types, defaults and the enum values behind each CHECK constraint.
 *   2. `supabase/migrations/*.sql` — every `add column if not exists` under an
 *      `alter table ... public.<table>`.
 *
 * Neither one mentions `created_date` or `updated_date`, which the adapter and several
 * pages sort on. Those are listed in UNVERIFIED_COLUMNS below rather than silently
 * accepted, so the guards can say "unproven" instead of "missing" or "fine".
 *
 * Used by the guard tests in this directory. Not imported by application code.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** Entity name (adapter surface) → table name. Mirrors TABLE_MAP in base44Client.js. */
export const TABLE_MAP = {
  Business: 'businesses',
  Contact: 'contacts',
  Interaction: 'interactions',
  Match: 'matches',
  Event: 'events',
  Task: 'tasks',
  Idea: 'ideas',
  Discussion: 'discussions',
  FinanceEntry: 'finance_entries',
  EmailTemplate: 'email_templates',
  AppSettings: 'app_settings',
  User: 'profiles',
};

/**
 * Columns every table gets from Postgres/Supabase rather than from a migration in this
 * repo, so their absence from the schema-of-record proves nothing.
 */
export const IMPLICIT_COLUMNS = ['id'];

/**
 * Columns the app reads or sorts on that the schema-of-record does not contain, and that
 * nothing in this repo can prove exist. They are accepted by the guards so the suite
 * stays green, and enumerated here so the list is reviewable: each entry is a live
 * verification the owner still owes.
 *
 * `<table>.<column>` or `*.<column>` for one that applies to every table.
 *
 * Do not add to this list to make a guard pass. Add the column to a migration instead.
 */
export const UNVERIFIED_COLUMNS = [
  // The adapter's list() falls back to .order('created_date', ...) for every entity, so
  // every table in TABLE_MAP needs it or every unsorted list query 400s. The app works
  // in production, which is the only evidence that it exists.
  '*.created_date',
  // Read on three tables and sorted on one. No migration adds it anywhere.
  'email_templates.updated_date',
  'businesses.updated_date',
  'profiles.updated_date',
];

/** Written by the app but deliberately not in the entity schemas. */
export const KNOWN_EXTRA_COLUMNS = [
  // supabase/migrations/20260814105153_discussions_archived.sql (not yet applied).
  'discussions.archived',
];

function stripJsonComments(text) {
  return text.replace(/^\s*\/\/.*$/gm, '');
}

/** @returns {Record<string, string[]>} table name → column names from the JSONC entities. */
function columnsFromEntities() {
  const dir = join(ROOT, 'base44', 'entities');
  /** @type {Record<string, string[]>} */
  const byTable = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.jsonc')) continue;
    const entity = file.replace(/\.jsonc$/, '');
    const table = TABLE_MAP[entity];
    if (!table) continue;
    const parsed = JSON.parse(stripJsonComments(readFileSync(join(dir, file), 'utf8')));
    byTable[table] = Object.keys(parsed.properties || {});
  }
  return byTable;
}

/** @returns {Record<string, string[]>} table name → column names added by migrations. */
function columnsFromMigrations() {
  const dir = join(ROOT, 'supabase', 'migrations');
  /** @type {Record<string, string[]>} */
  const byTable = {};
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.sql')) continue;
    const sql = readFileSync(join(dir, file), 'utf8');
    // Statements are `alter table [if exists] public.<t> add column if not exists <c> ...`
    // spread over many lines; a commented-out line is not a column.
    let table = null;
    for (const raw of sql.split('\n')) {
      const line = raw.trim();
      if (line.startsWith('--')) continue;
      const alter = line.match(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?"?([a-z_]+)"?/i);
      if (alter) table = alter[1];
      const column = line.match(/add\s+column\s+(?:if\s+not\s+exists\s+)?"?([a-z_]+)"?/i);
      if (table && column) {
        byTable[table] = byTable[table] || [];
        if (!byTable[table].includes(column[1])) byTable[table].push(column[1]);
      }
      if (line.endsWith(';')) table = null;
    }
  }
  return byTable;
}

/**
 * Every column name the schema-of-record contains, per table.
 *
 * @returns {Record<string, string[]>}
 */
export function schemaOfRecord() {
  const entities = columnsFromEntities();
  const migrations = columnsFromMigrations();
  /** @type {Record<string, string[]>} */
  const byTable = {};
  for (const table of Object.values(TABLE_MAP)) {
    byTable[table] = [
      ...new Set([...IMPLICIT_COLUMNS, ...(entities[table] || []), ...(migrations[table] || [])]),
    ].sort();
  }
  return byTable;
}

/**
 * Is `column` on `table` provable from the repo, or explicitly accepted as unprovable?
 *
 * @param {Record<string, string[]>} schema
 * @param {string} table
 * @param {string} column
 * @returns {'present' | 'unverified' | 'missing'}
 */
export function classifyColumn(schema, table, column) {
  if ((schema[table] || []).includes(column)) return 'present';
  if (KNOWN_EXTRA_COLUMNS.includes(`${table}.${column}`)) return 'present';
  if (UNVERIFIED_COLUMNS.includes(`${table}.${column}`)) return 'unverified';
  if (UNVERIFIED_COLUMNS.includes(`*.${column}`)) return 'unverified';
  return 'missing';
}

/**
 * Every non-test source file under `src/`.
 *
 * @param {string} [dir]
 * @returns {string[]} paths relative to the repo root
 */
export function sourceFiles(dir = join(ROOT, 'src')) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (!/\.(js|jsx)$/.test(entry)) return [];
    if (/\.test\.(js|jsx)$/.test(entry)) return [];
    return [full.slice(ROOT.length + 1)];
  });
}

/** @param {string} relativePath */
export function readSource(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}
