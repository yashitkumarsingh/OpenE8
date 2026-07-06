import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Stage6SignOff from './Stage6SignOff';

describe('Stage6SignOff Component', () => {
  const mockAssessment = {
    status: 'PLANNING',
    assessorSignature: '',
    assessorSignedAt: null,
    ownerSignature: '',
    ownerSignedAt: null
  };

  const defaultProps = {
    activeAssessment: mockAssessment,
    user: { name: 'Assessor User', role: 'ASSESSOR' },
    handleSignOff: () => {},
    generateReport: () => {}
  };

  it('renders null when activeAssessment is null', () => {
    const { container } = render(<Stage6SignOff {...defaultProps} activeAssessment={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders form inputs for ASSESSOR role and triggers handleSignOff callback on submit', () => {
    const handleSignOff = vi.fn();
    render(<Stage6SignOff {...defaultProps} handleSignOff={handleSignOff} />);

    expect(screen.getByText('Lead Security Assessor')).toBeInTheDocument();
    expect(screen.getAllByText('PENDING').length).toBeGreaterThan(0);

    const input = screen.getByTestId('sign-input-assessor');
    const form = input.closest('form');
    fireEvent.submit(form, {
      target: {
        sig: { value: 'Assessor Signature' }
      }
    });

    expect(handleSignOff).toHaveBeenCalledWith('ASSESSOR', 'Assessor Signature');
  });

  it('renders form inputs for SYSTEM_OWNER role and triggers handleSignOff', () => {
    const handleSignOff = vi.fn();
    render(
      <Stage6SignOff 
        {...defaultProps} 
        user={{ name: 'Owner User', role: 'SYSTEM_OWNER' }} 
        handleSignOff={handleSignOff} 
      />
    );

    const input = screen.getByTestId('sign-input-owner');
    const form = input.closest('form');
    fireEvent.submit(form, {
      target: {
        sig: { value: 'Owner Signature' }
      }
    });

    expect(handleSignOff).toHaveBeenCalledWith('SYSTEM_OWNER', 'Owner Signature');
  });

  it('displays signed credentials panel if signatures already present in activeAssessment', () => {
    const signedAssessment = {
      status: 'COMPLETED',
      assessorSignature: 'Assessor Signature Key',
      assessorSignedAt: '2026-07-06T10:00:00Z',
      ownerSignature: 'Owner Signature Key',
      ownerSignedAt: '2026-07-06T10:05:00Z'
    };

    render(<Stage6SignOff {...defaultProps} activeAssessment={signedAssessment} />);

    expect(screen.getByText('COMPLETED & LOCKED')).toBeInTheDocument();
    expect(screen.getByText('"Assessor Signature' + ' Key"')).toBeInTheDocument();
    expect(screen.getByText('"Owner Signature' + ' Key"')).toBeInTheDocument();
  });

  it('triggers generateReport callback when reports button is clicked', () => {
    const generateReport = vi.fn();
    render(<Stage6SignOff {...defaultProps} generateReport={generateReport} />);

    const reportBtn = screen.getByTestId('generate-report-redirect');
    fireEvent.click(reportBtn);

    expect(generateReport).toHaveBeenCalled();
  });
});
