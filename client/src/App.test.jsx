import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';

// Mock Recharts layout components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="mock-responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="mock-bar-chart">{children}</div>,
  Bar: () => <div data-testid="mock-bar" />,
  XAxis: () => <div data-testid="mock-x-axis" />,
  YAxis: () => <div data-testid="mock-y-axis" />,
  Tooltip: () => <div data-testid="mock-tooltip" />,
  Legend: () => <div data-testid="mock-legend" />,
  RadialBarChart: ({ children }) => <div data-testid="mock-radial-bar-chart">{children}</div>,
  RadialBar: () => <div data-testid="mock-radial-bar" />,
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('App Root Layout Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login page when no authentication token exists in storage', () => {
    render(<App />);
    expect(screen.getByText('OpenE8 Governance OS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('assessor@opene8.gov.au')).toBeInTheDocument();
  });

  it('performs user login, populates tokens, and transitions display successfully', async () => {
    // 1. Mock auth login post endpoint
    global.fetch.mockImplementation((url, options) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/auth/login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            token: 'mock-session-token',
            user: { email: 'assessor@opene8.gov.au', name: 'Lead Assessor', role: 'ASSESSOR' }
          })
        });
      }
      if (urlStr.includes('/api/catalog')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            {
              strategy: 'Application Control',
              slug: 'application-control',
              requirements: [{ id: 'E8-AC-ML1-01', text: 'Workstation AppControl', expectedEvidence: [], ismMapping: [] }]
            }
          ])
        });
      }
      // Check detail system request first to avoid matching /api/systems general route
      if (/\/api\/systems\/\w+/.test(urlStr)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'sys-1',
            name: 'Records System',
            targetMaturity: 'ML2',
            environment: 'Prod',
            exceptions: [],
            remediations: [],
            assessments: [
              { id: 'asm-1', status: 'PLANNING', testResults: [] }
            ]
          })
        });
      }
      if (urlStr.includes('/api/systems')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            { id: 'sys-1', name: 'Records System', targetMaturity: 'ML2', environment: 'Prod', exceptions: [], remediations: [], assessments: [] }
          ])
        });
      }
      return Promise.reject(new Error('Unknown URL: ' + urlStr));
    });

    render(<App />);

    // 2. Fill login details and submit
    fireEvent.change(screen.getByPlaceholderText('assessor@opene8.gov.au'), { target: { value: 'assessor@opene8.gov.au' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In to Environment' }));

    // 3. Confirm transition into main GRC dashboard layout
    await waitFor(() => {
      expect(screen.getAllByText('OpenE8').length).toBeGreaterThan(0);
      expect(screen.getByRole('option', { name: 'Records System' })).toBeInTheDocument();
    });

    // Check LocalStorage values
    expect(localStorage.getItem('opene8_token')).toBe('mock-session-token');
    expect(localStorage.getItem('opene8_user')).toContain('Lead Assessor');
  });

  it('displays auth error banner when login credentials validation fails', async () => {
    global.fetch.mockImplementation(() => Promise.resolve({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Incorrect email/password combo' })
    }));

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('assessor@opene8.gov.au'), { target: { value: 'wrong@opene8.gov.au' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), { target: { value: 'WrongPass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In to Environment' }));

    await waitFor(() => {
      expect(screen.getByText('Incorrect email/password combo')).toBeInTheDocument();
    });
  });
});
