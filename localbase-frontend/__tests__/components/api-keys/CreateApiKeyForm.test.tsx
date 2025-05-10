import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateApiKeyForm from '@/components/api-keys/CreateApiKeyForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { generateApiKey } from '@/lib/supabase';

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
  generateApiKey: jest.fn(),
}));

describe('CreateApiKeyForm', () => {
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
  
  it('renders the create API key form correctly', () => {
    render(<CreateApiKeyForm />);
    
    expect(screen.getByText('Create New API Key')).toBeInTheDocument();
    expect(screen.getByLabelText(/key name/i)).toBeInTheDocument();
    expect(screen.getByText(/permissions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/read models/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/create jobs/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create api key/i })).toBeInTheDocument();
  });
  
  it('validates form inputs', async () => {
    render(<CreateApiKeyForm />);
    
    // Try to submit with empty name
    fireEvent.click(screen.getByRole('button', { name: /create api key/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a key name/i)).toBeInTheDocument();
    });
    
    // Try to submit with name but no permissions
    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: 'My API Key' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create api key/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/please select at least one permission/i)).toBeInTheDocument();
    });
    
    // Verify generateApiKey was not called
    expect(generateApiKey).not.toHaveBeenCalled();
  });
  
  it('handles successful API key creation', async () => {
    const mockApiKey = {
      id: 'key123',
      name: 'My API Key',
      key: 'lb_abc123',
      permissions: ['read:models', 'create:jobs'],
      created_at: new Date().toISOString(),
    };
    
    (generateApiKey as jest.Mock).mockResolvedValueOnce({
      data: mockApiKey,
      error: null,
    });
    
    render(<CreateApiKeyForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: 'My API Key' },
    });
    
    // Select permissions
    fireEvent.click(screen.getByLabelText(/read models/i));
    fireEvent.click(screen.getByLabelText(/create jobs/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create api key/i }));
    
    await waitFor(() => {
      // Verify generateApiKey was called with correct parameters
      expect(generateApiKey).toHaveBeenCalledWith(
        mockUser.id,
        'My API Key',
        ['read:models', 'create:jobs']
      );
      
      // Verify success message and API key are displayed
      expect(screen.getByText(/api key created successfully/i)).toBeInTheDocument();
      expect(screen.getByText('lb_abc123')).toBeInTheDocument();
      expect(screen.getByText(/copy this key now/i)).toBeInTheDocument();
    });
  });
  
  it('handles API key creation error', async () => {
    (generateApiKey as jest.Mock).mockResolvedValueOnce({
      error: { message: 'Failed to create API key' },
    });
    
    render(<CreateApiKeyForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: 'My API Key' },
    });
    
    // Select permissions
    fireEvent.click(screen.getByLabelText(/read models/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create api key/i }));
    
    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText('Failed to create API key')).toBeInTheDocument();
    });
    
    // Verify success message is not displayed
    expect(screen.queryByText(/api key created successfully/i)).not.toBeInTheDocument();
  });
  
  it('handles unexpected errors', async () => {
    (generateApiKey as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<CreateApiKeyForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: 'My API Key' },
    });
    
    // Select permissions
    fireEvent.click(screen.getByLabelText(/read models/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create api key/i }));
    
    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });
  
  it('disables the submit button during form submission', async () => {
    // Create a delayed promise to simulate network request
    (generateApiKey as jest.Mock).mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: {
              id: 'key123',
              name: 'My API Key',
              key: 'lb_abc123',
              permissions: ['read:models'],
              created_at: new Date().toISOString(),
            },
            error: null,
          });
        }, 100);
      });
    });
    
    render(<CreateApiKeyForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: 'My API Key' },
    });
    
    // Select permissions
    fireEvent.click(screen.getByLabelText(/read models/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create api key/i }));
    
    // Verify button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    
    await waitFor(() => {
      // After completion, verify success message is displayed
      expect(screen.getByText(/api key created successfully/i)).toBeInTheDocument();
    });
  });
  
  it('allows copying the API key to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
    
    const mockApiKey = {
      id: 'key123',
      name: 'My API Key',
      key: 'lb_abc123',
      permissions: ['read:models'],
      created_at: new Date().toISOString(),
    };
    
    (generateApiKey as jest.Mock).mockResolvedValueOnce({
      data: mockApiKey,
      error: null,
    });
    
    render(<CreateApiKeyForm />);
    
    // Fill in the form and submit
    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: 'My API Key' },
    });
    
    fireEvent.click(screen.getByLabelText(/read models/i));
    fireEvent.click(screen.getByRole('button', { name: /create api key/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/api key created successfully/i)).toBeInTheDocument();
    });
    
    // Click the copy button
    fireEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));
    
    // Verify clipboard API was called with the correct value
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('lb_abc123');
    
    // Verify copy confirmation is displayed
    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });
  
  it('navigates to API keys list when done button is clicked', async () => {
    const mockApiKey = {
      id: 'key123',
      name: 'My API Key',
      key: 'lb_abc123',
      permissions: ['read:models'],
      created_at: new Date().toISOString(),
    };
    
    (generateApiKey as jest.Mock).mockResolvedValueOnce({
      data: mockApiKey,
      error: null,
    });
    
    render(<CreateApiKeyForm />);
    
    // Fill in the form and submit
    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: 'My API Key' },
    });
    
    fireEvent.click(screen.getByLabelText(/read models/i));
    fireEvent.click(screen.getByRole('button', { name: /create api key/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/api key created successfully/i)).toBeInTheDocument();
    });
    
    // Click the done button
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    
    // Verify navigation
    expect(mockPush).toHaveBeenCalledWith('/api-keys');
  });
});
