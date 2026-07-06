import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardTab from './DashboardTab';

// Mock Recharts layout components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

describe('DashboardTab Component', () => {
  const mockSystem = {
    name: 'Dashboard Test System',
    targetMaturity: 'ML3',
    maturity: {
      overallMaturity: 'ML2',
      technicalMaturity: 'ML1'
    }
  };

  it('renders null when selectedSystem is null', () => {
    const { container } = render(<DashboardTab selectedSystem={null} exceptions={[]} remediations={[]} activeAssessment={{}} chartData={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dashboard statistics overview panels correctly', () => {
    render(
      <DashboardTab 
        selectedSystem={mockSystem} 
        exceptions={[{ status: 'APPROVED', residualRisk: 'HIGH' }]} 
        remediations={[{ status: 'IN_PROGRESS' }]} 
        activeAssessment={{}} 
        chartData={[]} 
      />
    );

    expect(screen.getByText('Maturity Status')).toBeInTheDocument();
    expect(screen.getByText('ML2')).toBeInTheDocument();
    expect(screen.getByText('ML1')).toBeInTheDocument();
    expect(screen.getByText('Target: ML3')).toBeInTheDocument();

    expect(screen.getByText('Active Exceptions')).toBeInTheDocument();
    expect(screen.getByText('1 High/Extreme Residual Risk')).toBeInTheDocument();

    expect(screen.getByText('Remediation Board')).toBeInTheDocument();
    expect(screen.getByText('1 In Progress Tasks')).toBeInTheDocument();
  });
});
