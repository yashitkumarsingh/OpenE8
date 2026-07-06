import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AssessmentWorkspace from './AssessmentWorkspace';

// Mock EvidenceGraph
vi.mock('../evidence/EvidenceGraph', () => ({
  default: () => <div data-testid="mock-evidence-graph" />
}));

describe('AssessmentWorkspace Component', () => {
  const mockSystem = {
    name: 'Workspace Test System',
    targetMaturity: 'ML3',
    maturity: {
      overallMaturity: 'ML2',
      technicalMaturity: 'ML1'
    }
  };

  const mockAssessment = {
    id: 'asm-1',
    status: 'PLANNING',
    testResults: []
  };

  const defaultProps = {
    activeStage: 1,
    setActiveStage: () => {},
    catalog: [],
    selectedReqId: 'E8-AC-ML1-01',
    setSelectedReqId: () => {},
    activeAssessment: mockAssessment,
    selectedSystem: mockSystem,
    setActiveTab: () => {},
    user: { name: 'Lead Assessor', role: 'ASSESSOR' },
    currentReq: { id: 'E8-AC-ML1-01', text: 'App control text', expectedEvidence: [], ismMapping: [] },
    currentTest: { id: 'test-1', status: 'NOT_APPLICABLE', notes: '' },
    currentExceptions: [],
    currentRemediations: [],
    evidenceForm: {},
    setEvidenceForm: () => {},
    handleFileChange: () => {},
    handleAddEvidence: () => {},
    setShowEvidenceModal: () => {},
    evidenceTab: 'list',
    setEvidenceTab: () => {},
    verifyStates: {},
    handleVerifyEvidence: () => {},
    onDeleteEvidence: () => {},
    importerType: 'ENTRA_MFA',
    setImporterType: () => {},
    importerLoading: false,
    importerSummary: null,
    importerFile: {},
    handleImporterFileChange: () => {},
    handleRunImport: () => {},
    reviewView: 'graph',
    handleUpdateControlTest: () => {},
    exceptionForm: {},
    setExceptionForm: () => {},
    setShowExceptionModal: () => {},
    onDeleteException: () => {},
    remediationForm: {},
    setRemediationForm: () => {},
    setShowRemediationModal: () => {},
    onDeleteRemediation: () => {},
    handleSignOff: () => {}
  };

  it('renders workspace stages structure and layout correctly', () => {
    const { rerender } = render(<AssessmentWorkspace {...defaultProps} activeStage={1} />);
    expect(screen.getByText('Stage 1: Target Definition')).toBeInTheDocument();

    rerender(<AssessmentWorkspace {...defaultProps} activeStage={2} />);
    expect(screen.getByText('Stage 2: Boundary Scope Alignment')).toBeInTheDocument();

    rerender(<AssessmentWorkspace {...defaultProps} activeStage={3} />);
    expect(screen.getByText('Evidence Vault')).toBeInTheDocument();

    rerender(<AssessmentWorkspace {...defaultProps} activeStage={4} />);
    expect(screen.getByText('Stage 4: Compliance Review Desk')).toBeInTheDocument();

    rerender(<AssessmentWorkspace {...defaultProps} activeStage={5} />);
    expect(screen.getByText('Stage 5: Exceptions & Compensations')).toBeInTheDocument();

    rerender(<AssessmentWorkspace {...defaultProps} activeStage={6} />);
    expect(screen.getByText('Stage 6: Report, Sign-off & Lock')).toBeInTheDocument();
  });
});
