import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth: {}, functions: {}, storage: {}, from: () => ({}) } }));

const { base44 } = await import('@/api/base44Client');

const SRC = join(process.cwd(), 'src');

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(js|jsx)$/.test(entry) && !entry.endsWith('.test.js') && !entry.endsWith('.test.jsx') ? [full] : [];
  });
}

function callSites(pattern) {
  const found = [];
  for (const file of sourceFiles(SRC)) {
    const contents = readFileSync(file, 'utf8');
    for (const match of contents.matchAll(pattern)) {
      found.push({ file: file.slice(process.cwd().length + 1), name: match[1] });
    }
  }
  return found;
}

describe('adapter call sites match the adapter surface', () => {
  it('every base44.auth.* method a page calls actually exists', () => {
    const missing = callSites(/base44\.auth\.([A-Za-z0-9_]+)\s*\(/g)
      .filter(({ name }) => typeof base44.auth[name] !== 'function')
      .map(({ file, name }) => `${file}: base44.auth.${name}`);

    expect(missing).toEqual([]);
  });

  it('every base44.integrations.Core.* method a page calls actually exists', () => {
    const missing = callSites(/base44\.integrations\.Core\.([A-Za-z0-9_]+)\s*\(/g)
      .filter(({ name }) => typeof base44.integrations.Core[name] !== 'function')
      .map(({ file, name }) => `${file}: base44.integrations.Core.${name}`);

    expect(missing).toEqual([]);
  });

  it('every base44.entities.Entity.method call resolves', () => {
    const missing = callSites(/base44\.entities\.([A-Za-z0-9_]+\.[A-Za-z0-9_]+)\s*\(/g)
      .map(({ file, name }) => {
        const [entity, method] = name.split('.');
        return { file, entity, method };
      })
      .filter(({ entity, method }) => typeof base44.entities[entity]?.[method] !== 'function')
      .map(({ file, entity, method }) => `${file}: base44.entities.${entity}.${method}`);

    expect(missing).toEqual([]);
  });
});
