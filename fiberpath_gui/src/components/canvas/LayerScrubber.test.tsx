import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayerScrubber } from './LayerScrubber';

describe('LayerScrubber', () => {
  const onLayerChange = vi.fn();

  beforeEach(() => onLayerChange.mockReset());

  it('renders nothing when totalLayers is 0', () => {
    const { container } = render(
      <LayerScrubber totalLayers={0} currentLayer={0} onLayerChange={onLayerChange} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows "All" label when currentLayer equals totalLayers', () => {
    render(<LayerScrubber totalLayers={5} currentLayer={5} onLayerChange={onLayerChange} />);
    expect(screen.getByText(/Preview Layers:.*All/)).toBeInTheDocument();
  });

  it('shows "1-N" label when currentLayer is less than totalLayers', () => {
    render(<LayerScrubber totalLayers={8} currentLayer={3} onLayerChange={onLayerChange} />);
    expect(screen.getByText(/Preview Layers:.*1-3/)).toBeInTheDocument();
  });

  it('displays the totalLayers value', () => {
    render(<LayerScrubber totalLayers={10} currentLayer={5} onLayerChange={onLayerChange} />);
    expect(screen.getByText(/of\s+10/)).toBeInTheDocument();
  });

  it('renders a range input with correct min/max/value attributes', () => {
    render(<LayerScrubber totalLayers={10} currentLayer={4} onLayerChange={onLayerChange} />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.min).toBe('1');
    expect(slider.max).toBe('10');
    expect(slider.value).toBe('4');
  });

  it('calls onLayerChange with the parsed integer value on change', () => {
    render(<LayerScrubber totalLayers={10} currentLayer={4} onLayerChange={onLayerChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });
    expect(onLayerChange).toHaveBeenCalledWith(7);
  });
});
