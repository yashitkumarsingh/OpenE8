import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RemediationsTab from './RemediationsTab';

describe('RemediationsTab and KanbanBoard Component', () => {
  const mockRemediations = [
    {
      id: 'task-1',
      requirementId: 'E8-MFA-ML2-01',
      title: 'Setup Entra MFA',
      description: 'Configure MFA policies',
      assignedTo: 'SecOps Team',
      dueDate: '2026-12-31',
      ticketLink: 'https://jira.internal/SEC-101',
      status: 'BACKLOG'
    },
    {
      id: 'task-2',
      requirementId: 'E8-AC-ML2-01',
      title: 'Review rulesets',
      description: 'Annual ruleset review',
      assignedTo: 'Assessor CISO',
      dueDate: null,
      ticketLink: '',
      status: 'IN_PROGRESS'
    }
  ];

  const mockUser = {
    name: 'John Assessor',
    role: 'ASSESSOR'
  };

  it('renders Kanban board columns and task cards correctly', () => {
    render(
      <RemediationsTab 
        remediations={mockRemediations} 
        onUpdateStatus={() => {}} 
        user={mockUser} 
      />
    );

    expect(screen.getByText('Remediation Board')).toBeInTheDocument();
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();

    expect(screen.getByText('Setup Entra MFA')).toBeInTheDocument();
    expect(screen.getByText('Review rulesets')).toBeInTheDocument();
  });

  it('triggers onUpdateStatus callback when moving tasks', () => {
    const onUpdateStatus = vi.fn();
    const { rerender } = render(
      <RemediationsTab 
        remediations={mockRemediations} 
        onUpdateStatus={onUpdateStatus} 
        user={mockUser} 
      />
    );

    // task-1 is in BACKLOG column, can only move right to IN_PROGRESS
    const moveRightBtn = screen.getAllByTitle('Move Right')[0];
    fireEvent.click(moveRightBtn);
    expect(onUpdateStatus).toHaveBeenCalledWith('task-1', 'IN_PROGRESS');

    // Test task-2 (which is IN_PROGRESS) moving left to BACKLOG
    const moveLeftBtn = screen.getByTitle('Move Left');
    fireEvent.click(moveLeftBtn);
    expect(onUpdateStatus).toHaveBeenCalledWith('task-2', 'BACKLOG');

    // Test task-2 moving right to DONE
    const moveRightBtn2 = screen.getAllByTitle('Move Right')[1];
    fireEvent.click(moveRightBtn2);
    expect(onUpdateStatus).toHaveBeenCalledWith('task-2', 'DONE');

    // Test done task moving left to IN_PROGRESS
    const doneRemediations = [
      {
        id: 'task-3',
        requirementId: 'E8-UH-ML2-01',
        title: 'Block OLE packages',
        status: 'DONE'
      }
    ];

    rerender(
      <RemediationsTab 
        remediations={doneRemediations} 
        onUpdateStatus={onUpdateStatus} 
        user={mockUser} 
      />
    );

    const moveLeftBtn3 = screen.getByTitle('Move Left');
    fireEvent.click(moveLeftBtn3);
    expect(onUpdateStatus).toHaveBeenCalledWith('task-3', 'IN_PROGRESS');
  });

  it('hides movement buttons when user role is AUDITOR', () => {
    render(
      <RemediationsTab 
        remediations={mockRemediations} 
        onUpdateStatus={() => {}} 
        user={{ name: 'Anna Auditor', role: 'AUDITOR' }} 
      />
    );

    expect(screen.queryByTitle('Move Right')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Move Left')).not.toBeInTheDocument();
  });
});
