import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from './LoginPage.jsx';

describe('LoginPage Component', () => {
  it('renders login form items successfully', () => {
    render(
      <LoginPage
        loginEmail=""
        setLoginEmail={() => {}}
        loginPassword=""
        setLoginPassword={() => {}}
        loginError=""
        onSubmit={() => {}}
      />
    );

    expect(screen.getByText('OpenE8 Governance OS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('assessor@opene8.gov.au')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In to Environment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Microsoft Entra ID' })).toBeInTheDocument();
  });

  it('displays the error banner when error prop is provided', () => {
    render(
      <LoginPage
        loginEmail=""
        setLoginEmail={() => {}}
        loginPassword=""
        setLoginPassword={() => {}}
        loginError="Invalid Credentials"
        onSubmit={() => {}}
      />
    );

    expect(screen.getByText('Invalid Credentials')).toBeInTheDocument();
  });

  it('calls inputs triggers state on change and submit callbacks', () => {
    const setLoginEmail = vi.fn();
    const setLoginPassword = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());

    render(
      <LoginPage
        loginEmail="test@opene8.gov.au"
        setLoginEmail={setLoginEmail}
        loginPassword="password"
        setLoginPassword={setLoginPassword}
        loginError=""
        onSubmit={onSubmit}
      />
    );

    const emailInput = screen.getByPlaceholderText('assessor@opene8.gov.au');
    fireEvent.change(emailInput, { target: { value: 'new@opene8.gov.au' } });
    expect(setLoginEmail).toHaveBeenCalledWith('new@opene8.gov.au');

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
    expect(setLoginPassword).toHaveBeenCalledWith('newpassword');

    const submitBtn = screen.getByRole('button', { name: 'Sign In to Environment' });
    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalled();
  });
});
