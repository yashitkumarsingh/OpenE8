import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RiskBadge from './RiskBadge';

describe('RiskBadge Component', () => {
  it('renders EXTREME risk badge correctly', () => {
    render(<RiskBadge risk="EXTREME" />);
    const badge = screen.getByText('EXTREME');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-red-600/35');
  });

  it('renders HIGH risk badge correctly', () => {
    render(<RiskBadge risk="HIGH" />);
    const badge = screen.getByText('HIGH');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-rose-500/25');
  });

  it('renders MEDIUM risk badge correctly', () => {
    render(<RiskBadge risk="MEDIUM" />);
    const badge = screen.getByText('MEDIUM');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-amber-500/25');
  });

  it('renders LOW fallback risk badge correctly', () => {
    render(<RiskBadge risk="LOW" />);
    const badge = screen.getByText('LOW');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-blue-500/25');
  });

  it('renders LOW default fallback badge when risk is omitted or unknown', () => {
    render(<RiskBadge risk="UNKNOWN" />);
    const badge = screen.getByText('LOW');
    expect(badge).toBeInTheDocument();
  });
});
