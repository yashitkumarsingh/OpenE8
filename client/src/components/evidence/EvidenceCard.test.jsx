import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EvidenceCard from './EvidenceCard';

describe('EvidenceCard Component', () => {
  const mockEvidence = {
    id: 'ev-1',
    name: 'Backup logs.csv',
    sourceSystem: 'Veeam Backup',
    confidenceLevel: 'HIGH',
    notes: 'Weekly backup logs',
    urlOrPath: '/uploads/logs.csv'
  };

  it('renders evidence details and path attributes correctly', () => {
    render(
      <EvidenceCard 
        evidence={mockEvidence} 
        verifyState={null} 
        onVerify={() => {}} 
        onDelete={() => {}} 
        isCompleted={false} 
      />
    );

    expect(screen.getByText('Backup logs.csv')).toBeInTheDocument();
    expect(screen.getByText('Source: Veeam Backup')).toBeInTheDocument();
    expect(screen.getByText('"Weekly backup logs"')).toBeInTheDocument();
    expect(screen.getByTitle('Download/View file')).toBeInTheDocument();
  });

  it('displays VERIFIED when verifyState has verified set to true', () => {
    const state = { verified: true, message: 'Checksum verified.' };
    render(
      <EvidenceCard 
        evidence={mockEvidence} 
        verifyState={state} 
        onVerify={() => {}} 
        onDelete={() => {}} 
        isCompleted={false} 
      />
    );

    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
  });

  it('displays TAMPERED when verifyState has error set', () => {
    const state = { error: 'Hash mismatch.' };
    render(
      <EvidenceCard 
        evidence={mockEvidence} 
        verifyState={state} 
        onVerify={() => {}} 
        onDelete={() => {}} 
        isCompleted={false} 
      />
    );

    expect(screen.getByText('TAMPERED')).toBeInTheDocument();
  });

  it('triggers onVerify and onDelete when buttons are clicked', () => {
    const onVerify = vi.fn();
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <EvidenceCard 
        evidence={mockEvidence} 
        verifyState={null} 
        onVerify={onVerify} 
        onDelete={onDelete} 
        isCompleted={false} 
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    expect(onVerify).toHaveBeenCalledWith('ev-1');

    fireEvent.click(screen.getByTitle('Delete evidence'));
    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith('ev-1');
  });

  it('triggers download fetching when download button is clicked', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['hello'], { type: 'text/csv' }))
      })
    );
    window.URL.createObjectURL = vi.fn(() => 'mock-url');
    window.URL.revokeObjectURL = vi.fn();

    render(
      <EvidenceCard 
        evidence={mockEvidence} 
        verifyState={null} 
        onVerify={() => {}} 
        onDelete={() => {}} 
        isCompleted={false} 
      />
    );

    const downloadBtn = screen.getByTitle('Download/View file');
    fireEvent.click(downloadBtn);

    expect(fetchSpy).toHaveBeenCalledWith('/api/evidence/ev-1/download', expect.any(Object));
  });
});
