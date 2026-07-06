import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Stage2Catalog from './Stage2Catalog';

describe('Stage2Catalog Component', () => {
  it('renders boundary scope alignment values correctly', () => {
    const mockSystem = {
      platform: 'Azure Cloud',
      outOfScopeItems: 'Backup vault archives',
      dataSensitivity: 'PROTECTED'
    };

    render(<Stage2Catalog selectedSystem={mockSystem} />);
    
    expect(screen.getByText('Azure Cloud')).toBeInTheDocument();
    expect(screen.getByText('Backup vault archives')).toBeInTheDocument();
    expect(screen.getByText('PROTECTED')).toBeInTheDocument();
  });
});
