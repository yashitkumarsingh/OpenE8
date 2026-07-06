import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReportsTab from './ReportsTab';

describe('ReportsTab Component', () => {
  const mockReportData = {
    systemName: 'System Gamma',
    maturity: {
      targetMaturity: 'ML3',
      overallMaturity: 'ML2',
      strategyScores: {
        'Application Control': 'ML2'
      }
    },
    markdown: '# Executive Summary\nCompliant with E8-AC-ML1-01'
  };

  const mockSystem = {
    name: 'System Gamma',
    environment: 'Staging',
    businessOwner: 'Finance Branch',
    technicalOwner: 'SecOps Team'
  };

  const mockAssessment = {
    assessorSignature: 'Assessor Signature',
    assessorSignedAt: '2026-07-06T10:00:00Z',
    ownerSignature: '',
    ownerSignedAt: null
  };

  it('renders null when reportData is null', () => {
    const { container } = render(<ReportsTab reportData={null} selectedSystem={mockSystem} exceptions={[]} remediations={[]} activeAssessment={mockAssessment} onCopyMarkdown={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders report data summary details and signatures correctly', () => {
    render(
      <ReportsTab 
        reportData={mockReportData} 
        selectedSystem={mockSystem} 
        exceptions={[]} 
        remediations={[]} 
        activeAssessment={mockAssessment} 
        onCopyMarkdown={() => {}} 
      />
    );

    expect(screen.getByText('Governance Reporting Hub')).toBeInTheDocument();
    expect(screen.getByText('"Assessor Signature"')).toBeInTheDocument();
    expect(screen.getByText('Not signed (Pending Review)')).toBeInTheDocument();
  });

  it('triggers onCopyMarkdown and handlePrint operations when clicked', () => {
    const onCopyMarkdown = vi.fn();
    vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <ReportsTab 
        reportData={mockReportData} 
        selectedSystem={mockSystem} 
        exceptions={[]} 
        remediations={[]} 
        activeAssessment={mockAssessment} 
        onCopyMarkdown={onCopyMarkdown} 
      />
    );

    const copyBtn = screen.getByRole('button', { name: /copy markdown/i });
    fireEvent.click(copyBtn);
    expect(onCopyMarkdown).toHaveBeenCalled();

    const printBtn = screen.getByRole('button', { name: /print report/i });
    fireEvent.click(printBtn);
    expect(window.print).toHaveBeenCalled();
  });
});
