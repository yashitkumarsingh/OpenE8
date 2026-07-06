import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Stage3Evidence from './Stage3Evidence';

// Mock ImporterPanel
vi.mock('../../evidence/ImporterPanel', () => ({
  default: () => <div data-testid="mock-importer-panel" />
}));

describe('Stage3Evidence Component', () => {
  const mockTest = {
    id: 'test-1',
    evidenceList: [
      { id: 'ev-1', name: 'File A.pdf', sourceSystem: 'Manual', confidenceLevel: 'HIGH' }
    ]
  };

  const defaultProps = {
    evidenceTab: 'list',
    setEvidenceTab: () => {},
    activeAssessment: { status: 'PLANNING' },
    setShowEvidenceModal: () => {},
    currentTest: mockTest,
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
    csvHeaders: [],
    importerMapping: {},
    setImporterMapping: () => {}
  };

  it('renders uploaded evidence cards list in the Vault tab correctly', () => {
    render(<Stage3Evidence {...defaultProps} />);
    expect(screen.getByText('File A.pdf')).toBeInTheDocument();
  });

  it('renders "no evidence uploaded" message when evidence list is empty', () => {
    render(<Stage3Evidence {...defaultProps} currentTest={{ evidenceList: [] }} />);
    expect(screen.getByText('No evidence uploaded for this requirement yet.')).toBeInTheDocument();
  });

  it('triggers setEvidenceTab callback and renders mock importer panel when active tab is import', () => {
    const setEvidenceTab = vi.fn();
    const setShowEvidenceModal = vi.fn();
    const { rerender } = render(
      <Stage3Evidence 
        {...defaultProps} 
        setEvidenceTab={setEvidenceTab} 
        setShowEvidenceModal={setShowEvidenceModal}
      />
    );
    
    const importTabBtn = screen.getByTestId('evidence-tab-import');
    fireEvent.click(importTabBtn);
    expect(setEvidenceTab).toHaveBeenCalledWith('import');

    const uploadBtn = screen.getByTestId('add-evidence-button');
    fireEvent.click(uploadBtn);
    expect(setShowEvidenceModal).toHaveBeenCalledWith(true);

    const listTabBtn = screen.getByTestId('evidence-tab-list');
    fireEvent.click(listTabBtn);
    expect(setEvidenceTab).toHaveBeenCalledWith('list');

    rerender(<Stage3Evidence {...defaultProps} evidenceTab="import" />);
    expect(screen.getByTestId('mock-importer-panel')).toBeInTheDocument();
  });
});
