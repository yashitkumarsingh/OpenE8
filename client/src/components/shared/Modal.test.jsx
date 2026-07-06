import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from './Modal';

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Child Content</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal title and children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal Title">
        <div>Child Content Paragraph</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Child Content Paragraph')).toBeInTheDocument();
  });

  it('triggers onClose callback when clicking the close button', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    const closeBtn = screen.getByRole('button', { name: '✕' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
