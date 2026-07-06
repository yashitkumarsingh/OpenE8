import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ExceptionsTab from './ExceptionsTab';

describe('ExceptionsTab Component', () => {
  const mockExceptions = [
    {
      id: 'ex-1',
      requirementId: 'E8-MFA-ML2-01',
      riskStatement: 'Risk 1 details',
      compensatingControl: 'Control 1 details',
      approvedBy: 'Approver Alpha',
      residualRisk: 'HIGH',
      expiryDate: '2027-12-31',
      status: 'APPROVED'
    }
  ];

  it('renders "no exceptions" layout when exceptions array is empty', () => {
    render(<ExceptionsTab exceptions={[]} selectedSystem={{}} />);
    expect(screen.getByText('No formal exceptions registered for this system.')).toBeInTheDocument();
  });

  it('renders table rows mapping exceptions items successfully', () => {
    render(<ExceptionsTab exceptions={mockExceptions} selectedSystem={{}} />);
    
    expect(screen.getByText('E8-MFA-ML2-01')).toBeInTheDocument();
    expect(screen.getByText('Risk 1 details')).toBeInTheDocument();
    expect(screen.getByText('Control 1 details')).toBeInTheDocument();
    expect(screen.getByText('Approver Alpha')).toBeInTheDocument();
    expect(screen.getByText('HIGH', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
  });
});
