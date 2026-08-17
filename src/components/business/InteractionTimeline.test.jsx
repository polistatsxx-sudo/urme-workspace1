import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import InteractionTimeline from '@/components/business/InteractionTimeline';

vi.mock('@/components/shared/RichTextDisplay', () => ({ default: ({ content }) => <div>{content}</div> }));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const interaction = {
  id: 'ix-1',
  type: 'meeting',
  title: 'Coffee with Dana',
  interaction_date: '2026-08-17T10:30:00+00:00',
  notes: 'Talked shop',
};

describe('InteractionTimeline edit and delete controls', () => {
  afterEach(cleanup);

  it('offers no controls when the page passes no handlers', () => {
    render(<InteractionTimeline interactions={[interaction]} />);

    expect(screen.queryByLabelText('Edit interaction')).toBeNull();
    expect(screen.queryByLabelText('Delete interaction')).toBeNull();
  });

  it('hands the whole interaction back to the page that owns it', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<InteractionTimeline interactions={[interaction]} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText('Edit interaction'));
    expect(onEdit).toHaveBeenCalledWith(interaction);

    fireEvent.click(screen.getByLabelText('Delete interaction'));
    expect(onDelete).toHaveBeenCalledWith(interaction);
  });
});
