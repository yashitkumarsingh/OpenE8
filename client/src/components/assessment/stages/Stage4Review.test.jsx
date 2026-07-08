import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Stage4Review from './Stage4Review';

describe('Stage4Review Component', () => {
  const mockAssessment = {
    status: 'PLANNING',
    testResults: [
      {
        requirementId: 'E8-AC-ML1-01',
        requirement: { strategy: 'Application Control', targetMaturity: 'ML1' },
        status: 'EFFECTIVE',
        evidenceList: [],
        reviewer: 'CISO Office',
        notes: 'Verified workstations block libraries.'
      }
    ]
  };

  const mockReq = {
    id: 'E8-AC-ML1-01',
    text: 'Workstation AppControl text',
    expectedEvidence: ['Workstation logs']
  };

  const mockTest = {
    id: 'test-123',
    status: 'EFFECTIVE',
    notes: 'Verified workstations block libraries.'
  };

  const defaultProps = {
    reviewView: 'graph',
    setReviewView: () => {},
    activeAssessment: mockAssessment,
    currentReq: mockReq,
    currentTest: mockTest,
    setSelectedReqId: () => {},
    handleUpdateControlTest: () => {}
  };

  it('renders graph view controls and updates when EFFECTIVE is selected', () => {
    const handleUpdateControlTest = vi.fn();
    render(
      <Stage4Review 
        {...defaultProps} 
        handleUpdateControlTest={handleUpdateControlTest} 
      />
    );

    expect(screen.getByText('Stage 4: Compliance Review Desk')).toBeInTheDocument();
    expect(screen.getByText('Workstation logs')).toBeInTheDocument();

    const passedBtn = screen.getByRole('button', { name: 'EFFECTIVE' });
    fireEvent.click(passedBtn);
    expect(handleUpdateControlTest).toHaveBeenCalledWith('test-123', 'EFFECTIVE', 'Verified workstations block libraries.');
  });

  it('renders flat table grid when reviewView is set to table', () => {
    render(<Stage4Review {...defaultProps} reviewView="table" />);
    expect(screen.getByText('E8-AC-ML1-01')).toBeInTheDocument();
    expect(screen.getByText('ac')).toBeInTheDocument();
    expect(screen.getByText('Verified workstations block libraries.')).toBeInTheDocument();
  });
});
