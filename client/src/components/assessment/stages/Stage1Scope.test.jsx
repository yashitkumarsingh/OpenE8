import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Stage1Scope from './Stage1Scope';

describe('Stage1Scope Component', () => {
  it('renders target maturity and triggers setActiveTab when Configure is clicked', () => {
    const setActiveTab = vi.fn();
    render(
      <Stage1Scope 
        selectedSystem={{ targetMaturity: 'ML3' }} 
        setActiveTab={setActiveTab} 
      />
    );

    expect(screen.getByText('Current Target: ML3')).toBeInTheDocument();
    
    const configBtn = screen.getByRole('button', { name: /configure/i });
    fireEvent.click(configBtn);
    expect(setActiveTab).toHaveBeenCalledWith('systems');
  });
});
