import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayerRow } from './LayerRow';
import type { Layer } from '../../types/project';

const hoopLayer: Layer = { id: 'h1', type: 'hoop', hoop: { terminal: false } };
const hoopTerminalLayer: Layer = { id: 'h2', type: 'hoop', hoop: { terminal: true } };
const helicalLayer: Layer = {
  id: 'hl1',
  type: 'helical',
  helical: {
    wind_angle: 45,
    pattern_number: 1,
    skip_index: 1,
    lock_degrees: 0,
    lead_in_mm: 5,
    lead_out_degrees: 10,
    skip_initial_near_lock: false,
  },
};
const skipLayer: Layer = { id: 's1', type: 'skip', skip: { mandrel_rotation: 90 } };

function makeProps(layer: Layer, overrides: Partial<Parameters<typeof LayerRow>[0]> = {}) {
  return {
    layer,
    index: 0,
    isActive: false,
    onSelect: vi.fn(),
    onRemove: vi.fn(),
    onDuplicate: vi.fn(),
    ...overrides,
  };
}

describe('LayerRow', () => {
  beforeEach(() => vi.resetAllMocks());

  // ── Display ──────────────────────────────────────────────────────────────

  it('shows 1-based index', () => {
    render(<LayerRow {...makeProps(hoopLayer, { index: 2 })} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows hoop icon and type', () => {
    render(<LayerRow {...makeProps(hoopLayer)} />);
    expect(screen.getByText('○')).toBeInTheDocument();
    expect(screen.getByText('hoop')).toBeInTheDocument();
  });

  it('shows "Hoop" summary for non-terminal hoop layer', () => {
    render(<LayerRow {...makeProps(hoopLayer)} />);
    expect(screen.getByText('Hoop')).toBeInTheDocument();
  });

  it('shows "Hoop (Terminal)" summary for terminal hoop layer', () => {
    render(<LayerRow {...makeProps(hoopTerminalLayer)} />);
    expect(screen.getByText('Hoop (Terminal)')).toBeInTheDocument();
  });

  it('shows helical icon and "Helical 45°" summary', () => {
    render(<LayerRow {...makeProps(helicalLayer)} />);
    expect(screen.getByText('⟋')).toBeInTheDocument();
    expect(screen.getByText('Helical 45°')).toBeInTheDocument();
  });

  it('shows skip icon and "Skip 90°" summary', () => {
    render(<LayerRow {...makeProps(skipLayer)} />);
    expect(screen.getByText('↻')).toBeInTheDocument();
    expect(screen.getByText('Skip 90°')).toBeInTheDocument();
  });

  // ── Active state ──────────────────────────────────────────────────────────

  it('adds layer-row--active class when isActive is true', () => {
    const { container } = render(<LayerRow {...makeProps(hoopLayer, { isActive: true })} />);
    expect(container.firstChild).toHaveClass('layer-row--active');
  });

  it('does not add layer-row--active class when isActive is false', () => {
    const { container } = render(<LayerRow {...makeProps(hoopLayer, { isActive: false })} />);
    expect(container.firstChild).not.toHaveClass('layer-row--active');
  });

  // ── Interactions ─────────────────────────────────────────────────────────

  it('calls onSelect when the row is clicked', async () => {
    const props = makeProps(hoopLayer);
    const { container } = render(<LayerRow {...props} />);
    await userEvent.click(container.firstChild as HTMLElement);
    expect(props.onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onDuplicate and stops propagation when duplicate button is clicked', async () => {
    const props = makeProps(hoopLayer);
    render(<LayerRow {...props} />);
    await userEvent.click(screen.getByTitle('Duplicate layer'));
    expect(props.onDuplicate).toHaveBeenCalledTimes(1);
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('calls onRemove and stops propagation when remove button is clicked', async () => {
    const props = makeProps(hoopLayer);
    render(<LayerRow {...props} />);
    await userEvent.click(screen.getByTitle('Remove layer'));
    expect(props.onRemove).toHaveBeenCalledTimes(1);
    expect(props.onSelect).not.toHaveBeenCalled();
  });
});
