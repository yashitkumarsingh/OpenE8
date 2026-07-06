import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders PASS badge when status is PASSED', () => {
    render(<StatusBadge status="PASSED" />);
    const badge = screen.getByText('PASS');
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

  it('renders PARTIAL badge when status is PARTIAL', () => {
    render(<StatusBadge status="PARTIAL" />);
    expect(screen.getByText('PARTIAL')).toBeInTheDocument();
  });

  it('renders FAIL badge when status is FAILED', () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByText('FAIL')).toBeInTheDocument();
  });

  it('renders COMPENSATED badge when status is MET_VIA_COMPENSATING_CONTROL', () => {
    render(<StatusBadge status="MET_VIA_COMPENSATING_CONTROL" />);
    expect(screen.getByText('COMPENSATED')).toBeInTheDocument();
  });

  it('renders NEEDS REVIEW badge when status is NEEDS_REVIEW', () => {
    render(<StatusBadge status="NEEDS_REVIEW" />);
    expect(screen.getByText('NEEDS REVIEW')).toBeInTheDocument();
  });

  it('renders fallback N/A badge when status is unknown', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    const badge = screen.getByText('N/A');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-slate-400');
  });
});
