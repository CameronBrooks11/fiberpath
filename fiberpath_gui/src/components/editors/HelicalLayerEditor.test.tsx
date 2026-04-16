import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelicalLayerEditor } from './HelicalLayerEditor';
import { useProjectStore } from '../../stores/projectStore';
import { resetStores, seedLayers } from '../../tests/storeUtils';

beforeEach(() => resetStores());

describe('HelicalLayerEditor', () => {
  it('renders nothing when the layer id does not exist', () => {
    const { container } = render(<HelicalLayerEditor layerId="nonexistent" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the layer is not helical', () => {
    const [id] = seedLayers(['hoop']);
    const { container } = render(<HelicalLayerEditor layerId={id} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the Helical Layer Properties heading', () => {
    const [id] = seedLayers(['helical']);
    render(<HelicalLayerEditor layerId={id} />);
    expect(screen.getByText('Helical Layer Properties')).toBeInTheDocument();
  });

  it('renders all six numeric fields', () => {
    const [id] = seedLayers(['helical']);
    render(<HelicalLayerEditor layerId={id} />);
    expect(screen.getByText('Wind Angle')).toBeInTheDocument();
    expect(screen.getByText('Pattern Number')).toBeInTheDocument();
    expect(screen.getByText('Skip Index')).toBeInTheDocument();
    expect(screen.getByText('Lock Degrees')).toBeInTheDocument();
    expect(screen.getByText('Lead-in')).toBeInTheDocument();
    expect(screen.getByText('Lead-out Degrees')).toBeInTheDocument();
  });

  it('shows the default wind_angle value (45)', () => {
    const [id] = seedLayers(['helical']);
    render(<HelicalLayerEditor layerId={id} />);
    // wind_angle input is the first spinbutton
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs[0].value).toBe('45');
  });

  it('updates wind_angle in the store when input changes', () => {
    const [id] = seedLayers(['helical']);
    render(<HelicalLayerEditor layerId={id} />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '55' } });
    const layer = useProjectStore.getState().project.layers.find((l) => l.id === id)!;
    expect(layer.helical?.wind_angle).toBe(55);
  });

  it('shows a backend validation error for wind_angle', () => {
    const [id] = seedLayers(['helical']);
    useProjectStore.setState({
      validationErrors: { 'layers.helical.wind_angle': 'Invalid angle' },
    });
    render(<HelicalLayerEditor layerId={id} />);
    expect(screen.getByText('Invalid angle')).toBeInTheDocument();
  });

  it('renders the skip_initial_near_lock checkbox', () => {
    const [id] = seedLayers(['helical']);
    render(<HelicalLayerEditor layerId={id} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
