import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useMenubarInteractions } from './useMenubarInteractions';

// Test component that wires up the hook to a real <details> DOM structure
function TestMenubar({ count = 2 }: { count?: number }) {
  const { setMenuRef } = useMenubarInteractions();
  return (
    <nav>
      {Array.from({ length: count }, (_, i) => (
        <details key={i} ref={setMenuRef(i)} data-testid={`menu-${i}`}>
          <summary>Menu {i}</summary>
          <span>Item {i}</span>
        </details>
      ))}
    </nav>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useMenubarInteractions', () => {
  it('renders menus as closed by default', () => {
    render(<TestMenubar />);
    expect(screen.getByTestId('menu-0').hasAttribute('open')).toBe(false);
    expect(screen.getByTestId('menu-1').hasAttribute('open')).toBe(false);
  });

  it('closes other menus when one is toggled open', () => {
    render(<TestMenubar />);
    const menu0 = screen.getByTestId('menu-0') as HTMLDetailsElement;
    const menu1 = screen.getByTestId('menu-1') as HTMLDetailsElement;

    // Open menu1 first
    menu1.open = true;
    // Now open menu0 and fire the toggle event
    menu0.open = true;
    fireEvent(menu0, new Event('toggle'));

    // menu1 should be closed
    expect(menu1.open).toBe(false);
  });

  it('does not close menus when a closed menu fires toggle', () => {
    render(<TestMenubar />);
    const menu0 = screen.getByTestId('menu-0') as HTMLDetailsElement;
    const menu1 = screen.getByTestId('menu-1') as HTMLDetailsElement;

    menu1.open = true;
    // Firing toggle on menu0 which is NOT open — should not close menu1
    menu0.open = false;
    fireEvent(menu0, new Event('toggle'));

    expect(menu1.open).toBe(true);
  });

  it('closes all menus when clicking outside', () => {
    render(<TestMenubar />);
    const menu0 = screen.getByTestId('menu-0') as HTMLDetailsElement;
    const menu1 = screen.getByTestId('menu-1') as HTMLDetailsElement;

    menu0.open = true;
    menu1.open = true;

    // Click outside the menus
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    fireEvent.click(outside);

    expect(menu0.open).toBe(false);
    expect(menu1.open).toBe(false);
    document.body.removeChild(outside);
  });

  it('does not close menus when clicking on an item inside one', () => {
    render(<TestMenubar />);
    const menu0 = screen.getByTestId('menu-0') as HTMLDetailsElement;
    menu0.open = true;

    // Click the inner <span> (not the <summary>), which is inside the <details>
    // but does not trigger the native <details> toggle behaviour
    fireEvent.click(screen.getByText('Item 0'));

    // menu0 is still open (click-inside guard works)
    expect(menu0.open).toBe(true);
  });

  it('removes document listener on unmount', () => {
    const spy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<TestMenubar />);
    unmount();
    expect(spy).toHaveBeenCalledWith('click', expect.any(Function));
    spy.mockRestore();
  });
});
