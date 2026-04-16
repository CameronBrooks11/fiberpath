import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HoopLayerEditor } from './HoopLayerEditor';
import { useProjectStore } from '../../stores/projectStore';
import { resetStores, seedLayers } from '../../tests/storeUtils';

beforeEach(() => resetStores());

describe('HoopLayerEditor', () => {
  it('renders nothing when the layer id does not exist', () => {
    const { container } = render(<HoopLayerEditor layerId="nonexistent" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when layer type is not hoop', () => {
    const [id] = seedLayers(['helical']);
    const { container } = render(<HoopLayerEditor layerId={id} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the Hoop Layer Properties heading', () => {
    const [id] = seedLayers(['hoop']);
    render(<HoopLayerEditor layerId={id} />);
    expect(screen.getByText('Hoop Layer Properties')).toBeInTheDocument();
  });

  it('shows Terminal Layer checkbox unchecked by default', () => {
    const [id] = seedLayers(['hoop']);
    render(<HoopLayerEditor layerId={id} />);
    const checkbox = screen.getByRole('checkbox', { name: /Terminal Layer/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('toggles terminal flag in the store when checkbox changes', async () => {
    const [id] = seedLayers(['hoop']);
    render(<HoopLayerEditor layerId={id} />);
    const checkbox = screen.getByRole('checkbox', { name: /Terminal Layer/i });
    await userEvent.click(checkbox);
    const layer = useProjectStore.getState().project.layers.find((l) => l.id === id)!;
    expect(layer.hoop?.terminal).toBe(true);
  });

  it('shows checkbox already checked when layer is terminal', () => {
    const [id] = seedLayers(['hoop']);
    useProjectStore.setState((s) => ({
      project: {
        ...s.project,
        layers: s.project.layers.map((l) =>
          l.id === id ? { ...l, hoop: { terminal: true } } : l,
        ),
      },
    }));
    render(<HoopLayerEditor layerId={id} />);
    const checkbox = screen.getByRole('checkbox', { name: /Terminal Layer/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});
