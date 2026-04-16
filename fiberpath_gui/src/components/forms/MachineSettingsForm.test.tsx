import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MachineSettingsForm } from './MachineSettingsForm';
import { useProjectStore } from '../../stores/projectStore';
import { resetStores } from '../../tests/storeUtils';

beforeEach(() => resetStores());

describe('MachineSettingsForm', () => {
  it('renders the Machine Settings heading', () => {
    render(<MachineSettingsForm />);
    expect(screen.getByText('Machine Settings')).toBeInTheDocument();
  });

  it('shows the current defaultFeedRate from the store', () => {
    useProjectStore.setState((s) => ({
      project: { ...s.project, defaultFeedRate: 800 },
    }));
    render(<MachineSettingsForm />);
    const input = screen.getByLabelText('Default Feed Rate') as HTMLInputElement;
    expect(input.value).toBe('800');
  });

  it('calls updateDefaultFeedRate when input changes', () => {
    render(<MachineSettingsForm />);
    const input = screen.getByLabelText('Default Feed Rate');
    fireEvent.change(input, { target: { value: '1200' } });
    expect(useProjectStore.getState().project.defaultFeedRate).toBe(1200);
  });

  it('shows a backend validation error for feed rate', () => {
    useProjectStore.setState({
      validationErrors: { 'machine.defaultFeedRate': 'Invalid rate' },
    });
    render(<MachineSettingsForm />);
    expect(screen.getByText('Invalid rate')).toBeInTheDocument();
  });

  it('shows the mm/min unit label', () => {
    render(<MachineSettingsForm />);
    expect(screen.getByText('mm/min')).toBeInTheDocument();
  });
});
