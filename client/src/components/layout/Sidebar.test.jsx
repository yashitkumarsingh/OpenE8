import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar.jsx';

describe('Sidebar Component', () => {
  const mockSystems = [
    { id: 'sys-1', name: 'System Alpha' },
    { id: 'sys-2', name: 'System Beta' }
  ];
  const mockUser = {
    name: 'John Assessor',
    role: 'ASSESSOR'
  };

  it('renders sidebar brand, scope selector, user metadata, and tabs', () => {
    render(
      <Sidebar
        systems={mockSystems}
        selectedSystem={mockSystems[0]}
        onSelectSystem={() => {}}
        activeTab="dashboard"
        onTabChange={() => {}}
        user={mockUser}
        onLogout={() => {}}
        onAddSystemClick={() => {}}
      />
    );

    expect(screen.getByText('OpenE8')).toBeInTheDocument();
    expect(screen.getByText('Governance OS')).toBeInTheDocument();
    expect(screen.getByText('System Alpha')).toBeInTheDocument();
    expect(screen.getByText('System Beta')).toBeInTheDocument();
    expect(screen.getByText('John Assessor')).toBeInTheDocument();
    expect(screen.getByText('ASSESSOR')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Systems & Scope')).toBeInTheDocument();
  });

  it('triggers onSelectSystem callback on selector value change', () => {
    const onSelectSystem = vi.fn();
    render(
      <Sidebar
        systems={mockSystems}
        selectedSystem={mockSystems[0]}
        onSelectSystem={onSelectSystem}
        activeTab="dashboard"
        onTabChange={() => {}}
        user={mockUser}
        onLogout={() => {}}
        onAddSystemClick={() => {}}
      />
    );

    const select = screen.getByTestId('system-selector');
    fireEvent.change(select, { target: { value: 'sys-2' } });
    expect(onSelectSystem).toHaveBeenCalledWith('sys-2');
  });

  it('exclusively renders "Add New System" button for Assessor roles', () => {
    const { rerender } = render(
      <Sidebar
        systems={mockSystems}
        selectedSystem={mockSystems[0]}
        onSelectSystem={() => {}}
        activeTab="dashboard"
        onTabChange={() => {}}
        user={mockUser}
        onLogout={() => {}}
        onAddSystemClick={() => {}}
      />
    );

    expect(screen.getByTestId('add-system-button')).toBeInTheDocument();

    // Rerender with AUDITOR user
    rerender(
      <Sidebar
        systems={mockSystems}
        selectedSystem={mockSystems[0]}
        onSelectSystem={() => {}}
        activeTab="dashboard"
        onTabChange={() => {}}
        user={{ name: 'Anna Auditor', role: 'AUDITOR' }}
        onLogout={() => {}}
        onAddSystemClick={() => {}}
      />
    );
    expect(screen.queryByTestId('add-system-button')).not.toBeInTheDocument();
  });

  it('triggers onTabChange callback when clicking tabs', () => {
    const onTabChange = vi.fn();
    render(
      <Sidebar
        systems={mockSystems}
        selectedSystem={mockSystems[0]}
        onSelectSystem={() => {}}
        activeTab="dashboard"
        onTabChange={onTabChange}
        user={mockUser}
        onLogout={() => {}}
        onAddSystemClick={() => {}}
      />
    );

    const exceptionsTab = screen.getByTestId('nav-tab-exceptions');
    fireEvent.click(exceptionsTab);
    expect(onTabChange).toHaveBeenCalledWith('exceptions');
  });

  it('triggers onLogout callback when clicking sign out button', () => {
    const onLogout = vi.fn();
    render(
      <Sidebar
        systems={mockSystems}
        selectedSystem={mockSystems[0]}
        onSelectSystem={() => {}}
        activeTab="dashboard"
        onTabChange={() => {}}
        user={mockUser}
        onLogout={onLogout}
        onAddSystemClick={() => {}}
      />
    );

    const logoutBtn = screen.getByTestId('logout-button');
    fireEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalled();
  });
});
