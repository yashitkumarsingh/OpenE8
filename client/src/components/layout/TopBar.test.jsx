import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TopBar from './TopBar';

describe('TopBar Component', () => {
  it('renders default system placeholder info when selectedSystem is null', () => {
    render(<TopBar selectedSystem={null} />);
    expect(screen.getByText('No System Seeding')).toBeInTheDocument();
    expect(screen.getByText('ML2')).toBeInTheDocument();
  });

  it('renders system metadata and maturity calculations correctly', () => {
    const mockSystem = {
      name: 'HR Database System',
      targetMaturity: 'ML3',
      maturity: {
        technicalMaturity: 'ML1',
        overallMaturity: 'ML2'
      }
    };

    render(<TopBar selectedSystem={mockSystem} />);
    expect(screen.getByText('HR Database System')).toBeInTheDocument();
    expect(screen.getByText('ML3')).toBeInTheDocument();
    expect(screen.getByText('ML1')).toBeInTheDocument();
    expect(screen.getByText('ML2')).toBeInTheDocument();
  });

  it('applies red background/text styles for ML0 maturity states', () => {
    const mockSystem = {
      name: 'System Omega',
      targetMaturity: 'ML1',
      maturity: {
        technicalMaturity: 'ML0',
        overallMaturity: 'ML0'
      }
    };

    render(<TopBar selectedSystem={mockSystem} />);
    const techMaturityBadge = screen.getAllByText('ML0')[0];
    expect(techMaturityBadge.className).toContain('bg-rose-500/20');
  });
});
