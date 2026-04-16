import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomPanel } from './BottomPanel';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';

describe('BottomPanel', () => {
  it('renders the "Layer Stack" heading', () => {
    render(<BottomPanel><span>child</span></BottomPanel>);
    expect(screen.getByText('Layer Stack')).toBeInTheDocument();
  });

  it('renders its children', () => {
    render(<BottomPanel><span>bottom-content</span></BottomPanel>);
    expect(screen.getByText('bottom-content')).toBeInTheDocument();
  });
});

describe('LeftPanel', () => {
  it('renders the "Parameters" heading', () => {
    render(<LeftPanel><span>child</span></LeftPanel>);
    expect(screen.getByText('Parameters')).toBeInTheDocument();
  });

  it('renders its children', () => {
    render(<LeftPanel><span>left-content</span></LeftPanel>);
    expect(screen.getByText('left-content')).toBeInTheDocument();
  });
});

describe('RightPanel', () => {
  it('renders the "Properties" heading', () => {
    render(<RightPanel><span>child</span></RightPanel>);
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('renders its children', () => {
    render(<RightPanel><span>right-content</span></RightPanel>);
    expect(screen.getByText('right-content')).toBeInTheDocument();
  });
});
