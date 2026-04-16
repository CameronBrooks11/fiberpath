import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TowForm } from './TowForm';
import { useProjectStore } from '../../stores/projectStore';
import { resetStores } from '../../tests/storeUtils';

beforeEach(() => resetStores());

describe('TowForm', () => {
  it('renders the Tow Parameters heading', () => {
    render(<TowForm />);
    expect(screen.getByText('Tow Parameters')).toBeInTheDocument();
  });

  it('shows the current width from the store', () => {
    useProjectStore.setState((s) => ({
      project: { ...s.project, tow: { width: 15, thickness: 0.25 } },
    }));
    render(<TowForm />);
    const input = screen.getByLabelText('Width') as HTMLInputElement;
    expect(input.value).toBe('15');
  });

  it('shows the current thickness from the store', () => {
    useProjectStore.setState((s) => ({
      project: { ...s.project, tow: { width: 12.7, thickness: 0.3 } },
    }));
    render(<TowForm />);
    const input = screen.getByLabelText('Thickness') as HTMLInputElement;
    expect(input.value).toBe('0.3');
  });

  it('calls updateTow when the width input changes', () => {
    render(<TowForm />);
    const input = screen.getByLabelText('Width');
    fireEvent.change(input, { target: { value: '20' } });
    const { tow } = useProjectStore.getState().project;
    expect(tow.width).toBe(20);
  });

  it('calls updateTow when the thickness input changes', () => {
    render(<TowForm />);
    const input = screen.getByLabelText('Thickness');
    fireEvent.change(input, { target: { value: '0.5' } });
    const { tow } = useProjectStore.getState().project;
    expect(tow.thickness).toBe(0.5);
  });

  it('shows a backend validation error for width', () => {
    useProjectStore.setState({ validationErrors: { 'tow.width': 'Too wide' } });
    render(<TowForm />);
    expect(screen.getByText('Too wide')).toBeInTheDocument();
  });

  it('shows a backend validation error for thickness', () => {
    useProjectStore.setState({ validationErrors: { 'tow.thickness': 'Invalid' } });
    render(<TowForm />);
    expect(screen.getByText('Invalid')).toBeInTheDocument();
  });
});
