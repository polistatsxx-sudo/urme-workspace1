/**
 * Guard: every field the app sorts on exists in the schema-of-record.
 *
 * A sort key PostgREST does not recognise is a 400 on the whole query, so the list comes
 * back empty and the page looks like it has no data rather than like it is broken. There
 * is no runtime signal for it at all, which is why this is a static guard.
 *
 * Two shapes reach `.order()`:
 *   - explicit: `Entity.list('-date')`, `Entity.filter({...}, '-interaction_date')`
 *   - implicit: `Entity.list()` with no orderBy, which the adapter turns into
 *     `.order('created_date', { ascending: false })`
 *
 * A key the repo cannot prove exists is accepted only if it is named in
 * UNVERIFIED_COLUMNS, which is the list of live verifications the owner owes. Anything
 * else fails.
 */
import { describe, expect, it } from 'vitest';
import {
  TABLE_MAP,
  UNVERIFIED_COLUMNS,
  classifyColumn,
  readSource,
  schemaOfRecord,
  sourceFiles,
} from './schema-of-record.js';

const ENTITY_NAMES = Object.keys(TABLE_MAP).join('|');

/** `base44.entities.Event.list('-date')` / `.filter({ ... }, '-interaction_date')` */
const EXPLICIT_SORT = new RegExp(
  `base44\\.entities\\.(${ENTITY_NAMES})\\.(list|filter)\\(([^;]*?)\\)`,
  'g'
);

/**
 * @typedef {{ file: string, line: number, entity: string, column: string, implicit: boolean }} SortSite
 */

/** @returns {SortSite[]} */
function sortSites() {
  /** @type {SortSite[]} */
  const sites = [];
  for (const file of sourceFiles()) {
    if (file.startsWith('src/guards/')) continue;
    const contents = readSource(file);
    for (const match of contents.matchAll(EXPLICIT_SORT)) {
      const [, entity, method, args] = match;
      const line = contents.slice(0, match.index).split('\n').length;
      // The order-by argument is a string literal: the only one in `list()`, and the one
      // after the filter object in `filter()`.
      const literals = [...args.matchAll(/(['"])(-?[a-z_]+)\1/g)].map((m) => m[2]);
      const orderBy = method === 'list' ? literals[0] : literals[literals.length - 1];
      const isOrderBy = orderBy && (method === 'list' ? !args.includes('{') : args.includes('}'));
      if (isOrderBy) {
        sites.push({ file, line, entity, column: orderBy.replace(/^-/, ''), implicit: false });
      } else if (method === 'list') {
        // Only list() falls back to created_date. filter() with no orderBy adds no
        // order clause at all, so it sorts on nothing and cannot 400 on a bad key.
        sites.push({ file, line, entity, column: 'created_date', implicit: true });
      }
    }
  }
  return sites;
}

describe('sort keys resolve to the schema-of-record', () => {
  const schema = schemaOfRecord();
  const sites = sortSites();

  it('finds the sort sites at all, so a green result means something', () => {
    expect(sites.length).toBeGreaterThan(20);
    expect(sites.some((s) => !s.implicit)).toBe(true);
    expect(sites.some((s) => s.implicit)).toBe(true);
  });

  it('no sort key is missing from the schema-of-record', () => {
    const missing = sites
      .filter((s) => classifyColumn(schema, TABLE_MAP[s.entity], s.column) === 'missing')
      .map(
        (s) =>
          `${s.file}:${s.line}: ${s.entity}.${s.implicit ? 'list() → implicit ' : ''}order by ` +
          `"${s.column}" — no such column on ${TABLE_MAP[s.entity]}`
      );

    expect(missing).toEqual([]);
  });

  it('every accepted-but-unprovable sort key is still on the live-verification list', () => {
    // Guards the list itself: an entry removed from UNVERIFIED_COLUMNS because it was
    // verified should either be backed by a migration or start failing above.
    const unverified = new Set(
      sites
        .filter((s) => classifyColumn(schema, TABLE_MAP[s.entity], s.column) === 'unverified')
        .map((s) => `${TABLE_MAP[s.entity]}.${s.column}`)
    );

    for (const entry of unverified) {
      const table = entry.split('.')[0];
      const column = entry.slice(table.length + 1);
      expect(
        UNVERIFIED_COLUMNS.includes(entry) || UNVERIFIED_COLUMNS.includes(`*.${column}`)
      ).toBe(true);
    }

    // email_templates.updated_date is the one that is both unprovable and load-bearing:
    // the Templates page and the "Use Template" picker inside Log Interaction both sort
    // on it, and a 400 there empties the template list with no error shown.
    expect([...unverified]).toContain('email_templates.updated_date');
  });
});
