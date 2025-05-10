import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateJobForm from '@/components/jobs/CreateJobForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createJob } from '@/lib/supabase';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the supabase functions
jest.mock('@/lib/supabase', () => ({
  createJob: jest.fn(),
}));

describe('CreateJobForm', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });
  
  it('renders the create job form correctly', () => {
    render(<CreateJobForm />);
    
    expect(screen.getByText('Create New Job')).toBeInTheDocument();
    expect(screen.getByLabelText(/job name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create job/i })).toBeInTheDocument();
  });
  
  it('validates form inputs', async () => {
    render(<CreateJobForm />);
    
    // Try to submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /create job/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
    });
    
    // Fill in name only
    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'My Test Job' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create job/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
    });
    
    // Verify createJob was not called
    expect(createJob).not.toHaveBeenCalled();
  });
  
  it('handles successful job creation', async () => {
    const mockJob = {
      id: 'job123',
      name: 'My Test Job',
      model: 'gpt-4',
      prompt: 'Explain quantum computing',
      max_tokens: 1000,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    (createJob as jest.Mock).mockResolvedValueOnce({
      data: mockJob,
      error: null,
    });
    
    render(<CreateJobForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'My Test Job' },
    });
    
    fireEvent.change(screen.getByLabelText(/model/i), {
      target: { value: 'gpt-4' },
    });
    
    fireEvent.change(screen.getByLabelText(/prompt/i), {
      target: { value: 'Explain quantum computing' },
    });
    
    fireEvent.change(screen.getByLabelText(/max tokens/i), {
      target: { value: '1000' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create job/i }));
    
    await waitFor(() => {
      // Verify createJob was called with correct parameters
      expect(createJob).toHaveBeenCalledWith(
        mockUser.id,
        {
          name: 'My Test Job',
          model: 'gpt-4',
          prompt: 'Explain quantum computing',
          max_tokens: 1000,
        }
      );
      
      // Verify redirect to job details page
      expect(mockPush).toHaveBeenCalledWith(`/jobs/${mockJob.id}`);
    });
  });
  
  it('handles job creation error', async () => {
    (createJob as jest.Mock).mockResolvedValueOnce({
      error: { message: 'Failed to create job' },
    });
    
    render(<CreateJobForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'My Test Job' },
    });
    
    fireEvent.change(screen.getByLabelText(/model/i), {
      target: { value: 'gpt-4' },
    });
    
    fireEvent.change(screen.getByLabelText(/prompt/i), {
      target: { value: 'Explain quantum computing' },
    });
    
    fireEvent.change(screen.getByLabelText(/max tokens/i), {
      target: { value: '1000' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create job/i }));
    
    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText('Failed to create job')).toBeInTheDocument();
      
      // Verify redirect was not called
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
  
  it('handles unexpected errors', async () => {
    (createJob as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<CreateJobForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'My Test Job' },
    });
    
    fireEvent.change(screen.getByLabelText(/model/i), {
      target: { value: 'gpt-4' },
    });
    
    fireEvent.change(screen.getByLabelText(/prompt/i), {
      target: { value: 'Explain quantum computing' },
    });
    
    fireEvent.change(screen.getByLabelText(/max tokens/i), {
      target: { value: '1000' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create job/i }));
    
    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      
      // Verify redirect was not called
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
  
  it('disables the submit button during form submission', async () => {
    // Create a delayed promise to simulate network request
    (createJob as jest.Mock).mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: {
              id: 'job123',
              name: 'My Test Job',
              model: 'gpt-4',
              prompt: 'Explain quantum computing',
              max_tokens: 1000,
              status: 'pending',
              created_at: new Date().toISOString(),
            },
            error: null,
          });
        }, 100);
      });
    });
    
    render(<CreateJobForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'My Test Job' },
    });
    
    fireEvent.change(screen.getByLabelText(/model/i), {
      target: { value: 'gpt-4' },
    });
    
    fireEvent.change(screen.getByLabelText(/prompt/i), {
      target: { value: 'Explain quantum computing' },
    });
    
    fireEvent.change(screen.getByLabelText(/max tokens/i), {
      target: { value: '1000' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create job/i }));
    
    // Verify button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    
    await waitFor(() => {
      // After completion, verify redirect was called
      expect(mockPush).toHaveBeenCalledWith('/jobs/job123');
    });
  });
  
  it('validates max tokens as a number', async () => {
    render(<CreateJobForm />);
    
    // Fill in the form with invalid max tokens
    fireEvent.change(screen.getByLabelText(/job name/i), {
      target: { value: 'My Test Job' },
    });
    
    fireEvent.change(screen.getByLabelText(/model/i), {
      target: { value: 'gpt-4' },
    });
    
    fireEvent.change(screen.getByLabelText(/prompt/i), {
      target: { value: 'Explain quantum computing' },
    });
    
    fireEvent.change(screen.getByLabelText(/max tokens/i), {
      target: { value: 'not-a-number' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create job/i }));
    
    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText(/max tokens must be a number/i)).toBeInTheDocument();
    });
    
    // Verify createJob was not called
    expect(createJob).not.toHaveBeenCalled();
  });
});
