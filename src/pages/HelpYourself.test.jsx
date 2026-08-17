import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import HelpYourself from '@/pages/HelpYourself';
import { HELP_SECTIONS, groupHelpSections, searchHelpSections } from '@/data/helpContent';

// The section titles below are the ones the assertions key on. Accordion triggers are
// always rendered (only their content is collapsed), so a title in the document means the
// section survived the filter.
const PASSWORD_TOPIC = 'Reset a forgotten password';
const FINANCE_TOPIC = 'Log revenue and expenses';
const CSV_TOPIC = 'Import and export CSV files';

function search(value) {
  fireEvent.change(screen.getByLabelText('Search help topics'), { target: { value } });
}

describe('help content data', () => {
  it('gives every section a unique id, a title and a known category', () => {
    const ids = HELP_SECTIONS.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const section of HELP_SECTIONS) {
      expect(section.title, `section ${section.id} needs a title`).toBeTruthy();
      expect(section.keywords?.length, `section ${section.id} needs keywords`).toBeGreaterThan(0);
      expect(
        (section.steps?.length || 0) + (section.body?.length || 0),
        `section ${section.id} needs steps or body copy`
      ).toBeGreaterThan(0);
    }

    // groupHelpSections keeps unknown categories, so compare counts to catch a typo
    // that would otherwise quietly render its own stray heading.
    const grouped = groupHelpSections(HELP_SECTIONS);
    expect(grouped.flatMap((group) => group.sections)).toHaveLength(HELP_SECTIONS.length);
    expect(grouped.map((group) => group.category)).toEqual(
      expect.arrayContaining(['Getting started', 'Your network'])
    );
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
    expect(screen.getByText(/press and hold a card/i)).toBeTruthy();
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

    fireEvent.click(screen.getByRole('button', { name: 'Money & reporting' }));

    expect(screen.getByText(FINANCE_TOPIC)).toBeTruthy();
    expect(screen.queryByText(PASSWORD_TOPIC)).toBeNull();

    // "password" only matches sections outside the selected category.
    search('password');
    expect(screen.getByText('No results — try another term')).toBeTruthy();
  });
});
