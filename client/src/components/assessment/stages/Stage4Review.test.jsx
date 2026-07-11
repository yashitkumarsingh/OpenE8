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
    expectedEvidence: ['Workstation logs'],
    patchingWindow: '2_WEEKS',
    activeExploitPatchingWindow: '48_HOURS'
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
    expect(screen.getByText('Patching SLA: 2 WEEKS')).toBeInTheDocument();
    expect(screen.getByText('Active Exploit SLA: 48 HOURS')).toBeInTheDocument();

    const passedBtn = screen.getByRole('button', { name: 'EFFECTIVE' });
    fireEvent.click(passedBtn);
    expect(handleUpdateControlTest).toHaveBeenCalledWith('test-123', 'EFFECTIVE', 'Verified workstations block libraries.');
  });

  it('renders flat table grid when reviewView is set to table', () => {
    const setSelectedReqId = vi.fn();
    const setReviewView = vi.fn();

    render(
      <Stage4Review 
        {...defaultProps} 
        reviewView="table" 
        setSelectedReqId={setSelectedReqId}
        setReviewView={setReviewView}
      />
    );
    expect(screen.getByText('E8-AC-ML1-01')).toBeInTheDocument();
    expect(screen.getByText('ac')).toBeInTheDocument();
    expect(screen.getByText('Verified workstations block libraries.')).toBeInTheDocument();

    const row = screen.getByText('E8-AC-ML1-01').closest('tr');
    fireEvent.click(row);
    expect(setSelectedReqId).toHaveBeenCalledWith('E8-AC-ML1-01');
    expect(setReviewView).toHaveBeenCalledWith('graph');
  });

  it('renders warnings for candidate findings', () => {
    const candidateAssessment = {
      status: 'PLANNING',
      testResults: [
        {
          requirementId: 'E8-AC-ML1-01',
          requirement: { strategy: 'Application Control', targetMaturity: 'ML1' },
          status: 'PASS_CANDIDATE',
          evidenceList: [],
          reviewer: 'CISO Office',
          notes: 'Candidate scan results.'
        }
      ]
    };

    render(
      <Stage4Review 
        {...defaultProps} 
        activeAssessment={candidateAssessment} 
        currentTest={{ ...mockTest, status: 'PASS_CANDIDATE' }}
      />
    );

    expect(screen.getByText(/Candidate Finding/i)).toBeInTheDocument();
  });

  it('disables input elements when assessment status is COMPLETED', () => {
    const completedAssessment = { ...mockAssessment, status: 'COMPLETED' };
    const handleUpdateControlTest = vi.fn();

    render(
      <Stage4Review 
        {...defaultProps} 
        activeAssessment={completedAssessment} 
        handleUpdateControlTest={handleUpdateControlTest}
      />
    );

    const passedBtn = screen.getByRole('button', { name: 'EFFECTIVE' });
    expect(passedBtn).toBeDisabled();

    const notesArea = screen.getByPlaceholderText(/Describe current findings/i);
    expect(notesArea).toBeDisabled();
  });

  it('triggers updates when notes/findings are modified', () => {
    const handleUpdateControlTest = vi.fn();

    render(
      <Stage4Review 
        {...defaultProps} 
        handleUpdateControlTest={handleUpdateControlTest}
      />
    );

    const notesArea = screen.getByPlaceholderText(/Describe current findings/i);
    fireEvent.change(notesArea, { target: { value: 'New assessor findings notes' } });
    expect(handleUpdateControlTest).toHaveBeenCalledWith('test-123', 'EFFECTIVE', 'New assessor findings notes');
  });

  it('allows toggling between graph and table view modes', () => {
    const setReviewView = vi.fn();

    render(
      <Stage4Review 
        {...defaultProps} 
        setReviewView={setReviewView}
      />
    );

    const tableToggle = screen.getByRole('button', { name: 'Table' });
    fireEvent.click(tableToggle);
    expect(setReviewView).toHaveBeenCalledWith('table');

    const graphToggle = screen.getByRole('button', { name: 'Graph' });
    fireEvent.click(graphToggle);
    expect(setReviewView).toHaveBeenCalledWith('graph');
  });
});
