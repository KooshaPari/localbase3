import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { useRouter } from 'next/navigation';

// Mock the auth context to provide a user
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

describe('ResetPasswordForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup auth context mock to provide a logged in user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders the reset password form correctly', () => {
    render(<ResetPasswordForm />);

    expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    render(<ResetPasswordForm />);

    // Try to submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });

    // Fill in password only
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'newpassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });

    // Fill in both fields but with mismatched passwords
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'differentpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Verify updateUser was not called
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('handles successful password reset', async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: '123' } },
      error: null,
    });

    render(<ResetPasswordForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'newpassword123' },
    });

    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpassword123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      // Verify updateUser was called with correct parameters
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });

      // Verify redirect to sign in page
      expect(mockPush).toHaveBeenCalledWith('/signin');
    });

    // Verify no error message is displayed
    expect(screen.queryByText(/an unexpected error occurred/i)).not.toBeInTheDocument();
  });

  it('handles password reset error', async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
      error: { message: 'Invalid reset token' },
    });

    render(<ResetPasswordForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'newpassword123' },
    });

    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpassword123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText('Invalid reset token')).toBeInTheDocument();

      // Verify redirect was not called
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('handles unexpected errors', async () => {
    (supabase.auth.updateUser as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ResetPasswordForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'newpassword123' },
    });

    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpassword123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();

      // Verify redirect was not called
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('disables the submit button during form submission', async () => {
    // Create a delayed promise to simulate network request
    (supabase.auth.updateUser as jest.Mock).mockImplementationOnce(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { user: { id: '123' } },
            error: null,
          });
        }, 100);
      });
    });

    render(<ResetPasswordForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'newpassword123' },
    });

    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpassword123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Verify button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();

    await waitFor(() => {
      // After completion, verify redirect was called
      expect(mockPush).toHaveBeenCalledWith('/signin');
    });
  });
});
