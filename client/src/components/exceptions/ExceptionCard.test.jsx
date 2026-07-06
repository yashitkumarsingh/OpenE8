import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExceptionCard from './ExceptionCard';

describe('ExceptionCard Component', () => {
  const mockException = {
    id: 'ex-123',
    requirementId: 'E8-MFA-ML2-01',
    temporaryOrPermanent: 'TEMPORARY',
    residualRisk: 'HIGH',
    compensatingControlEfficacy: 'HIGH',
    compensatingControl: 'Strict hardware MFA logic',
    riskStatement: 'MFA parsing limitations',
    approvalReason: 'Compensating controls are validated as fully effective.',
    approvedBy: 'Assessor CISO',
    riskAcceptedBy: 'VP Operations',
    expiryDate: '2027-12-31',
    affectedUserCount: 15,
    nextReviewOwner: 'SecOps Team',
    status: 'ACTIVE'
  };

  it('renders complete exception data structure details correctly', () => {
    render(
      <ExceptionCard 
        exception={mockException} 
        onDelete={() => {}} 
        isCompleted={false} 
      />
    );

    expect(screen.getByText('EXCEPTION (TEMPORARY)')).toBeInTheDocument();
    expect(screen.getByText('Efficacy: HIGH')).toBeInTheDocument();
    expect(screen.getByText('HIGH', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('"Strict hardware MFA logic"')).toBeInTheDocument();
    expect(screen.getByText('MFA parsing limitations')).toBeInTheDocument();
    expect(screen.getByText('Assessor CISO')).toBeInTheDocument();
    expect(screen.getByText('VP Operations')).toBeInTheDocument();
    expect(screen.getByText('15 Users/Hosts')).toBeInTheDocument();
    expect(screen.getByText('SecOps Team')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('invokes onDelete when delete button is clicked and confirmed', () => {
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <ExceptionCard 
        exception={mockException} 
        onDelete={onDelete} 
        isCompleted={false} 
      />
    );

    const deleteBtn = screen.getByText('Revoke / Delete Exception');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith('ex-123');
  });

  it('hides delete button when isCompleted is true', () => {
    render(
      <ExceptionCard 
        exception={mockException} 
        onDelete={() => {}} 
        isCompleted={true} 
      />
    );

    expect(screen.queryByText('Revoke / Delete Exception')).not.toBeInTheDocument();
  });
});
