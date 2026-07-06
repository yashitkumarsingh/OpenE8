import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuditTab from './AuditTab';

describe('AuditTab Component', () => {
  const mockSystemWithLogs = {
    name: 'Test System',
    auditLogs: [
      {
        id: 'log-1',
        createdAt: '2026-07-06T10:00:00Z',
        userId: 'Assessor CISO',
        action: 'CREATE',
        entityType: 'Assessment',
        comment: 'Initial assessment package created.'
      },
      {
        id: 'log-2',
        createdAt: '2026-07-06T10:05:00Z',
        userId: 'Admin user',
        action: 'UPDATE',
        entityType: 'System',
        comment: ''
      }
    ]
  };

  it('renders "no change events" message when auditLogs is empty', () => {
    render(<AuditTab selectedSystem={{ auditLogs: [] }} handleDownloadAuditLog={() => {}} />);
    expect(screen.getByText('No change events recorded in system scope.')).toBeInTheDocument();
  });

  it('renders table headers and rows of audit trail items correctly', () => {
    render(<AuditTab selectedSystem={mockSystemWithLogs} handleDownloadAuditLog={() => {}} />);
    
    expect(screen.getByText('Assessor CISO')).toBeInTheDocument();
    expect(screen.getByText('CREATE')).toBeInTheDocument();
    expect(screen.getByText('Assessment')).toBeInTheDocument();
    expect(screen.getByText('Initial assessment package created.')).toBeInTheDocument();

    expect(screen.getByText('Admin user')).toBeInTheDocument();
    expect(screen.getByText('UPDATE')).toBeInTheDocument();
  });

  it('triggers handleDownloadAuditLog callback when export CSV is clicked', () => {
    const handleDownloadAuditLog = vi.fn();
    render(<AuditTab selectedSystem={mockSystemWithLogs} handleDownloadAuditLog={handleDownloadAuditLog} />);
    
    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportBtn);
    expect(handleDownloadAuditLog).toHaveBeenCalled();
  });
});
