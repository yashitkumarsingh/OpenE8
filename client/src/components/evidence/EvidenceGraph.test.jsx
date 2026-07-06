import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EvidenceGraph from './EvidenceGraph';

describe('EvidenceGraph Component', () => {
  const mockReq = {
    id: 'E8-AC-ML1-01',
    text: 'Application control workstations',
    expectedEvidence: 'Expected workstation logs',
    ismMapping: ['ISM-1507']
  };

  const defaultProps = {
    currentReq: mockReq,
    currentTest: { status: 'PASSED', notes: 'All fine.' },
    currentExceptions: [],
    currentRemediations: [],
    selectedReqId: 'E8-AC-ML1-01',
    setActiveStage: () => {},
    setExceptionForm: () => {},
    setShowExceptionModal: () => {},
    setRemediationForm: () => {},
    setShowRemediationModal: () => {},
    exceptionForm: {},
    remediationForm: {}
  };

  it('renders null when currentReq is null', () => {
    const { container } = render(<EvidenceGraph {...defaultProps} currentReq={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders evidence graph layout elements correctly', () => {
    render(<EvidenceGraph {...defaultProps} />);
    expect(screen.getByText('Interactive Evidence Graph')).toBeInTheDocument();
    expect(screen.getByText('E8-AC-ML1-01')).toBeInTheDocument();
    expect(screen.getByText('Application control workstations')).toBeInTheDocument();
    expect(screen.getByText('ISM: ISM-1507')).toBeInTheDocument();
  });
});
