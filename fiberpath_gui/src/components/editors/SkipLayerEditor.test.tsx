import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipLayerEditor } from './SkipLayerEditor';
import { useProjectStore } from '../../stores/projectStore';
import { resetStores, seedLayers } from '../../tests/storeUtils';

beforeEach(() => resetStores());

describe('SkipLayerEditor', () => {
  it('renders nothing when the layer id does not exist', () => {
    const { container } = render(<SkipLayerEditor layerId="nonexistent" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when layer type is not skip', () => {
    const [id] = seedLayers(['hoop']);
    const { container } = render(<SkipLayerEditor layerId={id} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the Skip Layer Properties heading', () => {
    const [id] = seedLayers(['skip']);
    render(<SkipLayerEditor layerId={id} />);
    expect(screen.getByText('Skip Layer Properties')).toBeInTheDocument();
  });

  it('shows the current mandrel_rotation value from the store', () => {
    const [id] = seedLayers(['skip']);
    useProjectStore.setState((s) => ({
      project: {
        ...s.project,
        layers: s.project.layers.map((l) =>
          l.id === id ? { ...l, skip: { mandrel_rotation: 45 } } : l,
        ),
      },
    }));
    render(<SkipLayerEditor layerId={id} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('45');
  });

  it('updates mandrel_rotation in the store when input changes', () => {
    const [id] = seedLayers(['skip']);
    render(<SkipLayerEditor layerId={id} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '180' } });
    const layer = useProjectStore.getState().project.layers.find((l) => l.id === id)!;
    expect(layer.skip?.mandrel_rotation).toBe(180);
  });

  it('displays a backend validation error', () => {
    const [id] = seedLayers(['skip']);
    useProjectStore.setState({
      validationErrors: { 'layers.skip.mandrel_rotation': 'Invalid rotation' },
    });
    render(<SkipLayerEditor layerId={id} />);
    expect(screen.getByText('Invalid rotation')).toBeInTheDocument();
  });
});
