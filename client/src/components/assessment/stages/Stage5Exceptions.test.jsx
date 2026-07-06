import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Stage5Exceptions from './Stage5Exceptions';

// Mock ExceptionCard
vi.mock('../../exceptions/ExceptionCard', () => ({
  default: ({ exception, onDelete }) => (
    <div data-testid="mock-exception-card">
      <span>{exception.compensatingControl}</span>
      <button onClick={() => onDelete(exception.id)}>Delete</button>
    </div>
  )
}));

describe('Stage5Exceptions Component', () => {
  const mockException = {
    id: 'ex-1',
    compensatingControl: 'Air-gapped vault storage'
  };

  const defaultProps = {
    selectedReqId: 'E8-AC-ML1-01',
    setExceptionForm: () => {},
    setShowExceptionModal: () => {},
    currentExceptions: [mockException],
    exceptionForm: {},
    onDeleteException: () => {},
    activeAssessment: { status: 'PLANNING' }
  };

  it('renders exception card when exception items exist', () => {
    render(<Stage5Exceptions {...defaultProps} />);
    expect(screen.getByTestId('mock-exception-card')).toBeInTheDocument();
    expect(screen.getByText('Air-gapped vault storage')).toBeInTheDocument();
  });

  it('renders "no exceptions" layout message when exceptions list is empty', () => {
    render(<Stage5Exceptions {...defaultProps} currentExceptions={[]} />);
    expect(screen.getByText('No exception active or pending approval for this requirement.')).toBeInTheDocument();
  });

  it('triggers setExceptionForm and setShowExceptionModal callbacks when Log Exception is clicked', () => {
    const setExceptionForm = vi.fn();
    const setShowExceptionModal = vi.fn();

    render(
      <Stage5Exceptions 
        {...defaultProps} 
        setExceptionForm={setExceptionForm}
        setShowExceptionModal={setShowExceptionModal}
      />
    );

    const logBtn = screen.getByRole('button', { name: /log exception request/i });
    fireEvent.click(logBtn);

    expect(setExceptionForm).toHaveBeenCalled();
    expect(setShowExceptionModal).toHaveBeenCalledWith(true);
  });
});
