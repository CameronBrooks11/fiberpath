import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MandrelForm } from './MandrelForm';
import { useProjectStore } from '../../stores/projectStore';
import { resetStores } from '../../tests/storeUtils';

beforeEach(() => resetStores());

describe('MandrelForm', () => {
  it('renders the Mandrel Parameters heading', () => {
    render(<MandrelForm />);
    expect(screen.getByText('Mandrel Parameters')).toBeInTheDocument();
  });

  it('shows the current diameter from the store', () => {
    useProjectStore.setState((s) => ({
      project: { ...s.project, mandrel: { diameter: 200, wind_length: 750 } },
    }));
    render(<MandrelForm />);
    const input = screen.getByLabelText('Diameter') as HTMLInputElement;
    expect(input.value).toBe('200');
  });

  it('shows the current wind_length from the store', () => {
    useProjectStore.setState((s) => ({
      project: { ...s.project, mandrel: { diameter: 150, wind_length: 900 } },
    }));
    render(<MandrelForm />);
    const input = screen.getByLabelText('Wind Length') as HTMLInputElement;
    expect(input.value).toBe('900');
  });

  it('calls updateMandrel when the diameter input changes', () => {
    render(<MandrelForm />);
    const input = screen.getByLabelText('Diameter');
    fireEvent.change(input, { target: { value: '180' } });
    const { mandrel } = useProjectStore.getState().project;
    expect(mandrel.diameter).toBe(180);
  });

  it('calls updateMandrel when the wind_length input changes', () => {
    render(<MandrelForm />);
    const input = screen.getByLabelText('Wind Length');
    fireEvent.change(input, { target: { value: '600' } });
    const { mandrel } = useProjectStore.getState().project;
    expect(mandrel.wind_length).toBe(600);
  });

  it('shows a backend validation error for diameter', () => {
    useProjectStore.setState({ validationErrors: { 'mandrel.diameter': 'Too small' } });
    render(<MandrelForm />);
    expect(screen.getByText('Too small')).toBeInTheDocument();
  });

  it('shows a backend validation error for wind_length', () => {
    useProjectStore.setState({ validationErrors: { 'mandrel.wind_length': 'Too long' } });
    render(<MandrelForm />);
    expect(screen.getByText('Too long')).toBeInTheDocument();
  });
});
