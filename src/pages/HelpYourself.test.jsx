import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import HelpYourself from '@/pages/HelpYourself';
import { HELP_SECTIONS, groupHelpSections, searchHelpSections } from '@/data/helpContent';

// The section titles below are what the assertions key on. Accordion triggers are always
// rendered (only their content is collapsed), so a title in the document means the section
// survived the filter.
const PASSWORD_TOPIC = 'Forgot your password?';
const FINANCE_TOPIC = 'Write down money coming in or going out';
const CSV_TOPIC = 'Bring in a spreadsheet, or save one out';

function search(value) {
  fireEvent.change(screen.getByLabelText('Search help topics'), { target: { value } });
}

describe('help content data', () => {
  it('gives every section a unique id, a title, keywords and a "what this is for" line', () => {
    const ids = HELP_SECTIONS.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const section of HELP_SECTIONS) {
      expect(section.title, `section ${section.id} needs a title`).toBeTruthy();
      expect(section.whatFor, `section ${section.id} needs a whatFor line`).toBeTruthy();
      expect(section.keywords?.length, `section ${section.id} needs keywords`).toBeGreaterThan(0);
      expect(
        (section.steps?.length || 0) + (section.body?.length || 0) + (section.afterSteps?.length || 0),
        `section ${section.id} needs steps or body copy`
      ).toBeGreaterThan(0);
      // afterSteps only makes sense underneath a list of steps.
      if (section.afterSteps?.length) {
        expect(section.steps?.length, `${section.id} has afterSteps but no steps`).toBeGreaterThan(0);
      }
    }

    // groupHelpSections keeps unknown categories, so compare counts to catch a typo
    // that would otherwise quietly render its own stray heading.
    const grouped = groupHelpSections(HELP_SECTIONS);
    expect(grouped.flatMap((group) => group.sections)).toHaveLength(HELP_SECTIONS.length);
    expect(grouped.map((group) => group.category)).toEqual(
      expect.arrayContaining(['Getting started', 'Your businesses and people'])
    );
  });

  it('gives every section at least one friendly extra — a tip, a fix, or a note on who can do it', () => {
    for (const section of HELP_SECTIONS) {
      expect(
        Boolean(section.tip || section.ifStuck || section.roleNote),
        `section ${section.id} should offer a tip, an "if it doesn't work", or a role note`
      ).toBe(true);
    }
  });

  it('keeps the plain-language house style: short "what this is for" lines, no insider terms', () => {
    for (const section of HELP_SECTIONS) {
      expect(
        section.whatFor.length,
        `whatFor for ${section.id} should stay to one short line`
      ).toBeLessThan(120);
    }

    // Words that would send a first-time reader to a search engine. Button labels are
    // fine — these are the ones no part of the interface actually says.
    const jargon = ['entity', 'entities', 'postgrest', 'supabase', 'rls', 'jsonb', 'endpoint', 'invokellm', 'edge function'];
    for (const section of HELP_SECTIONS) {
      const prose = [section.whatFor, ...(section.body || []), ...(section.steps || []), ...(section.afterSteps || []), section.tip || '', section.ifStuck || '', section.roleNote || '']
        .join(' ')
        .toLowerCase();
      for (const term of jargon) {
        expect(prose.includes(term), `${section.id} should not use "${term}"`).toBe(false);
      }
    }
  });

  it('returns every section for an empty query', () => {
    expect(searchHelpSections('')).toHaveLength(HELP_SECTIONS.length);
    expect(searchHelpSections('   ')).toHaveLength(HELP_SECTIONS.length);
  });

  it('matches on title, body and keywords that never appear in the visible copy', () => {
    expect(searchHelpSections('password').map((s) => s.id)).toContain('reset-password');
    expect(searchHelpSections('receivables').map((s) => s.id)).toContain('receivables');
    // "kanban" only exists as a keyword on the pipeline section.
    expect(searchHelpSections('kanban').map((s) => s.id)).toEqual(['pipeline-stages']);
  });

  it('finds topics from the words a confused beginner would actually type', () => {
    // None of these phrases are section titles; they come from the keyword lists.
    expect(searchHelpSections('locked out').length).toBeGreaterThan(0);
    expect(searchHelpSections('missing button').map((s) => s.id)).toContain('team-and-roles');
    expect(searchHelpSections('oops').map((s) => s.id)).toContain('what-you-cannot-undo');
    expect(searchHelpSections('spreadsheet').map((s) => s.id)).toContain('csv-import-export');
  });

  it('narrows rather than widens when a query has several terms', () => {
    const single = searchHelpSections('export');
    const double = searchHelpSections('export csv');
    expect(double.length).toBeGreaterThan(0);
    expect(double.length).toBeLessThanOrEqual(single.length);
    expect(double.every((section) => single.includes(section))).toBe(true);
  });

  it('is case-insensitive and returns nothing for an unknown term', () => {
    expect(searchHelpSections('CSV').map((s) => s.id)).toEqual(searchHelpSections('csv').map((s) => s.id));
    expect(searchHelpSections('nothingmatchesthis')).toEqual([]);
  });
});

describe('How-To Guide page', () => {
  // vitest runs without globals, so Testing Library's auto-cleanup is not registered.
  afterEach(cleanup);

  it('renders the heading, the search box and the full topic list up front', () => {
    render(<HelpYourself />);

    expect(screen.getByRole('heading', { name: 'How-To Guide' })).toBeTruthy();
    expect(screen.getByLabelText('Search help topics')).toBeTruthy();
    expect(screen.getByText(PASSWORD_TOPIC)).toBeTruthy();
    expect(screen.getByText(FINANCE_TOPIC)).toBeTruthy();
    expect(screen.queryByText(/no results/i)).toBeNull();
  });

  it('shows what each topic is for without needing to open it', () => {
    render(<HelpYourself />);

    // The one-liner for the password topic, visible while the section is still collapsed.
    expect(screen.getByText('Getting back in when you cannot remember your password.')).toBeTruthy();
  });

  it('filters the list down to matching sections as the user types', () => {
    render(<HelpYourself />);

    search('password');

    expect(screen.getByText(PASSWORD_TOPIC)).toBeTruthy();
    expect(screen.queryByText(FINANCE_TOPIC)).toBeNull();
    expect(screen.queryByText(CSV_TOPIC)).toBeNull();
  });

  it('reports how many topics matched and opens them so the answer is visible', () => {
    render(<HelpYourself />);

    search('kanban');

    expect(screen.getByRole('status').textContent).toContain('1 topic');
    // The single match is expanded, so its step copy is on screen without another click.
    expect(screen.getByText(/press and hold the card/i)).toBeTruthy();
  });

  it('puts the numbered steps before the notes that only apply afterwards', () => {
    render(<HelpYourself />);

    search('welcome back');

    const firstStep = screen.getByText('Open URME in your web browser.');
    const afterNote = screen.getByText('You land on the Dashboard. That is the home screen.');

    // Node.DOCUMENT_POSITION_FOLLOWING === 4: afterNote comes later in the document.
    expect(firstStep.compareDocumentPosition(afterNote) & 4).toBeTruthy();
  });

  it('renders the tip and "if it doesn\'t work" helpers inside an open topic', () => {
    render(<HelpYourself />);

    search('kanban');

    expect(screen.getByText('Tip:')).toBeTruthy();
    expect(screen.getByText('If it doesn’t work:')).toBeTruthy();
  });

  it('shows a tip as a labelled callout, not as loose text in the paragraphs', () => {
    render(<HelpYourself />);

    search('what is urme');

    // The tip belongs to the intro topic. It has to sit inside the callout that carries
    // the "Tip:" label, not trail off the end of the body copy.
    const tipText = screen.getByText(/"tap" means click/);
    expect(tipText.textContent).toContain('Tip:');
  });

  it('shows the empty state when nothing matches, and recovers from it', () => {
    render(<HelpYourself />);

    search('zzzzznotatopic');

    expect(screen.getByText('No results — try another term')).toBeTruthy();
    expect(screen.queryByText(PASSWORD_TOPIC)).toBeNull();
    expect(screen.queryByText(FINANCE_TOPIC)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /show all topics/i }));

    expect(screen.queryByText(/no results/i)).toBeNull();
    expect(screen.getByText(PASSWORD_TOPIC)).toBeTruthy();
    expect(screen.getByText(FINANCE_TOPIC)).toBeTruthy();
  });

  it('clears the query from the search box, restoring the full list', () => {
    render(<HelpYourself />);

    search('password');
    expect(screen.queryByText(FINANCE_TOPIC)).toBeNull();

    fireEvent.click(screen.getByLabelText('Clear search'));

    expect(screen.getByText(FINANCE_TOPIC)).toBeTruthy();
    expect(screen.getByLabelText('Search help topics').value).toBe('');
  });

  it('browses by topic chip, and combines the chip with the search box', () => {
    render(<HelpYourself />);

    fireEvent.click(screen.getByRole('button', { name: 'Money and reports' }));

    expect(screen.getByText(FINANCE_TOPIC)).toBeTruthy();
    expect(screen.queryByText(PASSWORD_TOPIC)).toBeNull();

    // "password" only matches sections outside the selected category.
    search('password');
    expect(screen.getByText('No results — try another term')).toBeTruthy();
  });
});
