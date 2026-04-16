import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MainTab } from './MainTab';

function renderMainTab(overrides: Partial<Parameters<typeof MainTab>[0]> = {}) {
  const props = {
    leftPanel: <div>left panel</div>,
    centerCanvas: <div>center canvas</div>,
    rightPanel: <div>right panel</div>,
    bottomPanel: <div>bottom panel</div>,
    ...overrides,
  };
  return render(<MainTab {...props} />);
}

describe('MainTab', () => {
  it('renders all four panel slot contents', () => {
    renderMainTab();
    expect(screen.getByText('left panel')).toBeInTheDocument();
    expect(screen.getByText('center canvas')).toBeInTheDocument();
    expect(screen.getByText('right panel')).toBeInTheDocument();
    expect(screen.getByText('bottom panel')).toBeInTheDocument();
  });

  it('left aside does not have collapsed class by default', () => {
    const { container } = renderMainTab();
    const aside = container.querySelector('.main-layout__left-panel');
    expect(aside?.classList.contains('collapsed')).toBe(false);
    expect(aside?.getAttribute('data-collapsed')).toBe('false');
  });

  it('right aside does not have collapsed class by default', () => {
    const { container } = renderMainTab();
    const aside = container.querySelector('.main-layout__right-panel');
    expect(aside?.classList.contains('collapsed')).toBe(false);
    expect(aside?.getAttribute('data-collapsed')).toBe('false');
  });

  it('adds collapsed class and data-collapsed=true when leftPanelCollapsed=true', () => {
    const { container } = renderMainTab({ leftPanelCollapsed: true });
    const aside = container.querySelector('.main-layout__left-panel');
    expect(aside?.classList.contains('collapsed')).toBe(true);
    expect(aside?.getAttribute('data-collapsed')).toBe('true');
  });

  it('adds collapsed class and data-collapsed=true when rightPanelCollapsed=true', () => {
    const { container } = renderMainTab({ rightPanelCollapsed: true });
    const aside = container.querySelector('.main-layout__right-panel');
    expect(aside?.classList.contains('collapsed')).toBe(true);
    expect(aside?.getAttribute('data-collapsed')).toBe('true');
  });

  it('renders the workspace root element', () => {
    const { container } = renderMainTab();
    expect(container.querySelector('.main-layout__workspace')).toBeInTheDocument();
  });

  it('renders center and bottom panel inside main-layout__center', () => {
    const { container } = renderMainTab();
    const center = container.querySelector('.main-layout__center');
    expect(center).toBeInTheDocument();
    expect(center?.querySelector('.main-layout__canvas')).toBeInTheDocument();
    expect(center?.querySelector('.main-layout__bottom-panel')).toBeInTheDocument();
  });
});
