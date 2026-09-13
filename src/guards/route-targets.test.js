/**
 * Guard: every navigation target in the app resolves to a route registered in App.jsx.
 *
 * `App.test.jsx` renders one route and asserts it does not fall through to the 404 page.
 * This is the static half, and it covers programmatic navigation as well as `<Link to>`:
 * `navigate('/contacts')` compiles, renders and clicks fine, and only shows up as a
 * PageNotFound after the user has already committed to the action (deleting a record, for
 * instance).
 *
 * Only literal targets can be checked. A target built entirely out of variables is
 * reported so the count is honest, not silently skipped.
 */
import { describe, expect, it } from 'vitest';
import { readSource, sourceFiles } from './schema-of-record.js';

/** `<Route path="/businesses/:id" ...>` — the registered route patterns. */
function registeredRoutes() {
  const app = readSource('src/App.jsx');
  return [...app.matchAll(/<Route\s+[^>]*path="([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Turn a route pattern into a matcher. `:param` accepts one non-empty segment; `*`
 * accepts anything, but a catch-all route is not proof that a target is reachable, so
 * catch-alls are excluded before this runs.
 *
 * @param {string} pattern
 */
function routeMatcher(pattern) {
  const source = pattern
    .split('/')
    .map((segment) => (segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return new RegExp(`^${source}$`);
}

/**
 * Every literal navigation target: `to="/x"`, `to={'/x'}`, `to={`/x/${id}`}`,
 * `navigate('/x')`, `navigate(`/x/${id}`)`, `<Navigate to="/x">`.
 *
 * A template literal's `${...}` holes stand in for a route parameter, so they become the
 * `:param` wildcard. A target that is only a variable (`to={item.path}`) has no literal
 * to check and is returned as `dynamic`.
 */
function navigationTargets() {
  /** @type {{ file: string, line: number, raw: string, path: string | null }[]} */
  const targets = [];
  const patterns = [
    /\bto=\{?["'`]([^"'`]*)["'`]\}?/g,
    /\bnavigate\(\s*["'`]([^"'`]*)["'`]/g,
    /\bto=\{\s*([A-Za-z_$][\w.$]*)\s*\}/g,
    /\bnavigate\(\s*([A-Za-z_$][\w.$]*)\s*\)/g,
  ];
  for (const file of sourceFiles()) {
    if (file.startsWith('src/guards/')) continue;
    if (file === 'src/App.jsx') continue;
    const contents = readSource(file);
    for (const [index, pattern] of patterns.entries()) {
      const literal = index < 2;
      for (const match of contents.matchAll(pattern)) {
        const raw = match[1];
        const line = contents.slice(0, match.index).split('\n').length;
        if (!literal) {
          targets.push({ file, line, raw, path: null });
          continue;
        }
        // Query strings and hashes are not part of the route.
        const path = raw.replace(/\$\{[^}]*\}/g, ':param').split(/[?#]/)[0];
        targets.push({ file, line, raw, path });
      }
    }
  }
  return targets;
}

describe('navigation targets resolve to registered routes', () => {
  const routes = registeredRoutes();
  const matchers = routes.filter((r) => r !== '*').map(routeMatcher);
  const targets = navigationTargets();
  const literals = targets.filter((t) => t.path !== null);

  it('finds the route table and the call sites, so a green result means something', () => {
    expect(routes).toContain('/');
    expect(routes).toContain('/businesses/:id');
    expect(routes.length).toBeGreaterThan(15);
    expect(literals.length).toBeGreaterThan(20);
    expect(literals.some((t) => t.file.includes('navigate') === false)).toBe(true);
  });

  it('no <Link to> or navigate() target is missing from the route table', () => {
    const dead = literals
      .filter((t) => t.path && t.path.startsWith('/'))
      .filter((t) => !matchers.some((m) => m.test(t.path)))
      .map((t) => `${t.file}:${t.line}: "${t.raw}" matches no <Route path> in App.jsx`);

    expect(dead).toEqual([]);
  });

  it('the only non-literal targets are the ones driven by a checked table', () => {
    // Sidebar builds its links from navItems, which is checked by its own assertion
    // below rather than by the regex sweep.
    const dynamic = targets.filter((t) => t.path === null).map((t) => `${t.file}: ${t.raw}`);

    expect(dynamic).toEqual(['src/components/layout/Sidebar.jsx: item.path']);
  });

  it('every path in the sidebar nav table is a registered route or an in-page action', () => {
    const sidebar = readSource('src/components/layout/Sidebar.jsx');
    const navPaths = [...sidebar.matchAll(/\{\s*path:\s*'([^']+)'/g)].map((m) => m[1]);

    expect(navPaths.length).toBeGreaterThan(10);
    const dead = navPaths
      .filter((path) => path.startsWith('/'))
      .filter((path) => !matchers.some((m) => m.test(path)));

    expect(dead).toEqual([]);
  });
});
