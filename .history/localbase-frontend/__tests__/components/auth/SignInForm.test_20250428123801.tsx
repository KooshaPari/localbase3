import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInForm from '@/components/auth/SignInForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SignInForm', () => {
  const mockSignIn = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
    });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });
  
  it('renders the sign in form correctly', () => {
    render(<SignInForm />);
    
    expect(screen.getByText('Sign In to LocalBase')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });
  
  it('validates form inputs', async () => {
    render(<SignInForm />);
    
    // Try to submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });
    
    // Verify signIn was not called
    expect(mockSignIn).not.toHaveBeenCalled();
  });
  
  it('handles successful sign in', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });
    
    render(<SignInForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      // Verify signIn was called with correct parameters
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      
      // Verify redirect to dashboard
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    
    // Verify no error message is displayed
    expect(screen.queryByText(/an unexpected error occurred/i)).not.toBeInTheDocument();
  });
  
  it('handles sign in error', async () => {
    mockSignIn.mockResolvedValueOnce({ 
      error: { message: 'Invalid login credentials' } 
    });
    
    render(<SignInForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
      
      // Verify redirect was not called
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
  
  it('handles unexpected errors', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Network error'));
    
    render(<SignInForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      
      // Verify redirect was not called
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
  
  it('disables the submit button during form submission', async () => {
    // Create a delayed promise to simulate network request
    mockSignIn.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ error: null });
        }, 100);
      });
    });
    
    render(<SignInForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    
    await waitFor(() => {
      // After completion, verify redirect was called
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
