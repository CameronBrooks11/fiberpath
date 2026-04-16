import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MainLayout } from './MainLayout';

describe('MainLayout', () => {
  it('renders the menuBar slot', () => {
    render(
      <MainLayout
        menuBar={<nav>menu</nav>}
        content={<main>content</main>}
        statusBar={<footer>status</footer>}
      />,
    );
    expect(screen.getByText('menu')).toBeInTheDocument();
  });

  it('renders the content slot', () => {
    render(
      <MainLayout
        menuBar={<nav>menu</nav>}
        content={<main>workspace</main>}
        statusBar={<footer>status</footer>}
      />,
    );
    expect(screen.getByText('workspace')).toBeInTheDocument();
  });

  it('renders the statusBar slot', () => {
    render(
      <MainLayout
        menuBar={<nav>menu</nav>}
        content={<main>content</main>}
        statusBar={<footer>status-bar</footer>}
      />,
    );
    expect(screen.getByText('status-bar')).toBeInTheDocument();
  });

  it('renders the tabBar slot when provided', () => {
    render(
      <MainLayout
        menuBar={<nav>menu</nav>}
        tabBar={<div>tabs</div>}
        content={<main>content</main>}
        statusBar={<footer>status</footer>}
      />,
    );
    expect(screen.getByText('tabs')).toBeInTheDocument();
  });

  it('omits the tabBar wrapper when tabBar is not provided', () => {
    render(
      <MainLayout
        menuBar={<nav>menu</nav>}
        content={<main>content</main>}
        statusBar={<footer>status</footer>}
      />,
    );
    // No tabBar text present
    expect(screen.queryByText('tabs')).not.toBeInTheDocument();
  });

  it('renders optional children', () => {
    render(
      <MainLayout
        menuBar={<nav>menu</nav>}
        content={<main>content</main>}
        statusBar={<footer>status</footer>}
      >
        <div>extra</div>
      </MainLayout>,
    );
    expect(screen.getByText('extra')).toBeInTheDocument();
  });
});
