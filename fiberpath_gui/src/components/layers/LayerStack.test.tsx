import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayerStack } from './LayerStack';
import { useProjectStore } from '../../stores/projectStore';
import { resetStores, seedLayers } from '../../tests/storeUtils';

// Mock @hello-pangea/dnd to avoid DnD setup complexity in jsdom
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({
    children,
  }: {
    children: (
      provided: { innerRef: React.Ref<HTMLDivElement>; droppableProps: object; placeholder: null },
      snapshot: { isDraggingOver: boolean },
    ) => React.ReactNode;
  }) =>
    children(
      { innerRef: { current: null } as unknown as React.Ref<HTMLDivElement>, droppableProps: {}, placeholder: null },
      { isDraggingOver: false },
    ),
  Draggable: ({
    children,
  }: {
    children: (
      provided: { innerRef: React.Ref<HTMLDivElement>; draggableProps: { style: undefined }; dragHandleProps: object },
      snapshot: { isDragging: boolean },
    ) => React.ReactNode;
  }) =>
    children(
      {
        innerRef: { current: null } as unknown as React.Ref<HTMLDivElement>,
        draggableProps: { style: undefined },
        dragHandleProps: {},
      },
      { isDragging: false },
    ),
}));

beforeEach(() => resetStores());

describe('LayerStack', () => {
  describe('empty state', () => {
    it('shows empty state message when there are no layers', () => {
      render(<LayerStack />);
      expect(screen.getByText('No layers yet')).toBeInTheDocument();
    });

    it('shows the hint text', () => {
      render(<LayerStack />);
      expect(screen.getByText(/Click "Add Layer" to get started/)).toBeInTheDocument();
    });
  });

  describe('Add Layer', () => {
    it('shows the "+ Add Layer" button', () => {
      render(<LayerStack />);
      expect(screen.getByRole('button', { name: '+ Add Layer' })).toBeInTheDocument();
    });

    it('toggles the type picker on click', async () => {
      render(<LayerStack />);
      await userEvent.click(screen.getByRole('button', { name: '+ Add Layer' }));
      expect(screen.getByText('Hoop Layer')).toBeInTheDocument();
      expect(screen.getByText('Helical Layer')).toBeInTheDocument();
      expect(screen.getByText('Skip Layer')).toBeInTheDocument();
    });

    it('adds a hoop layer when Hoop Layer is clicked', async () => {
      render(<LayerStack />);
      await userEvent.click(screen.getByRole('button', { name: '+ Add Layer' }));
      await userEvent.click(screen.getByText('Hoop Layer'));
      const { layers } = useProjectStore.getState().project;
      expect(layers).toHaveLength(1);
      expect(layers[0].type).toBe('hoop');
    });

    it('adds a helical layer when Helical Layer is clicked', async () => {
      render(<LayerStack />);
      await userEvent.click(screen.getByRole('button', { name: '+ Add Layer' }));
      await userEvent.click(screen.getByText('Helical Layer'));
      const { layers } = useProjectStore.getState().project;
      expect(layers[0].type).toBe('helical');
    });

    it('adds a skip layer when Skip Layer is clicked', async () => {
      render(<LayerStack />);
      await userEvent.click(screen.getByRole('button', { name: '+ Add Layer' }));
      await userEvent.click(screen.getByText('Skip Layer'));
      const { layers } = useProjectStore.getState().project;
      expect(layers[0].type).toBe('skip');
    });

    it('hides the type picker after a type is selected', async () => {
      render(<LayerStack />);
      await userEvent.click(screen.getByRole('button', { name: '+ Add Layer' }));
      await userEvent.click(screen.getByText('Hoop Layer'));
      expect(screen.queryByText('Helical Layer')).not.toBeInTheDocument();
    });
  });

  describe('with layers', () => {
    it('renders a row for each existing layer', () => {
      seedLayers(['hoop', 'helical', 'skip']);
      render(<LayerStack />);
      // Each layer index is rendered 1-based; we have indices 1, 2, 3
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not show the empty-state text when layers exist', () => {
      seedLayers(['hoop']);
      render(<LayerStack />);
      expect(screen.queryByText('No layers yet')).not.toBeInTheDocument();
    });
  });

  describe('layer actions', () => {
    it('removes a layer when the remove button is clicked', async () => {
      seedLayers(['hoop']);
      render(<LayerStack />);
      await userEvent.click(screen.getByTitle('Remove layer'));
      expect(useProjectStore.getState().project.layers).toHaveLength(0);
    });

    it('duplicates a layer when the duplicate button is clicked', async () => {
      seedLayers(['helical']);
      render(<LayerStack />);
      await userEvent.click(screen.getByTitle('Duplicate layer'));
      expect(useProjectStore.getState().project.layers).toHaveLength(2);
    });

    it('sets activeLayerId when a layer row is clicked', async () => {
      const [id] = seedLayers(['hoop']);
      render(<LayerStack />);
      // Click the row content (index label is safe to click)
      await userEvent.click(screen.getByText('1'));
      expect(useProjectStore.getState().project.activeLayerId).toBe(id);
    });
  });
});
