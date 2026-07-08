import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders EFFECTIVE badge when status is EFFECTIVE', () => {
    render(<StatusBadge status="EFFECTIVE" />);
    const badge = screen.getByText('EFFECTIVE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-emerald-400');
  });

  it('renders CANDIDATE PASS badge when status is PASS_CANDIDATE', () => {
    render(<StatusBadge status="PASS_CANDIDATE" />);
    const badge = screen.getByText('CANDIDATE PASS');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-lime-400');
  });

  it('renders CANDIDATE FAIL badge when status is FAIL_CANDIDATE', () => {
    render(<StatusBadge status="FAIL_CANDIDATE" />);
    const badge = screen.getByText('CANDIDATE FAIL');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-orange-400');
  });

  it('renders NOT IMPLEMENTED badge when status is NOT_IMPLEMENTED', () => {
    render(<StatusBadge status="NOT_IMPLEMENTED" />);
    expect(screen.getByText('NOT IMPLEMENTED')).toBeInTheDocument();
  });

  it('renders INEFFECTIVE badge when status is INEFFECTIVE', () => {
    render(<StatusBadge status="INEFFECTIVE" />);
    expect(screen.getByText('INEFFECTIVE')).toBeInTheDocument();
  });

  it('renders ALTERNATE CONTROL badge when status is ALTERNATE_CONTROL', () => {
    render(<StatusBadge status="ALTERNATE_CONTROL" />);
    expect(screen.getByText('ALTERNATE CONTROL')).toBeInTheDocument();
  });

  it('renders NO VISIBILITY badge when status is NO_VISIBILITY', () => {
    render(<StatusBadge status="NO_VISIBILITY" />);
    expect(screen.getByText('NO VISIBILITY')).toBeInTheDocument();
  });

  it('renders NOT APPLICABLE badge when status is NOT_APPLICABLE', () => {
    render(<StatusBadge status="NOT_APPLICABLE" />);
    expect(screen.getByText('NOT APPLICABLE')).toBeInTheDocument();
  });

  it('renders NOT ASSESSED badge when status is NOT_ASSESSED', () => {
    render(<StatusBadge status="NOT_ASSESSED" />);
    expect(screen.getByText('NOT ASSESSED')).toBeInTheDocument();
  });

  it('renders fallback N/A badge when status is unknown', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    const badge = screen.getByText('N/A');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-slate-400');
  });
});
