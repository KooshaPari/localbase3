import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { useAuth } from '@/contexts/AuthContext';
import { listJobs, listApiKeys } from '@/lib/supabase';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the supabase functions
jest.mock('@/lib/supabase', () => ({
  listJobs: jest.fn(),
  listApiKeys: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

describe('DashboardPage', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };
  const mockJobs = [
    {
      id: 'job1',
      name: 'Test Job 1',
      model: 'gpt-4',
      status: 'completed',
      created_at: new Date().toISOString(),
    },
    {
      id: 'job2',
      name: 'Test Job 2',
      model: 'gpt-3.5-turbo',
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  ];
  const mockApiKeys = [
    {
      id: 'key1',
      name: 'Test API Key 1',
      created_at: new Date().toISOString(),
    },
    {
      id: 'key2',
      name: 'Test API Key 2',
      created_at: new Date().toISOString(),
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });
    
    (listJobs as jest.Mock).mockResolvedValue({
      data: mockJobs,
      error: null,
    });
    
    (listApiKeys as jest.Mock).mockResolvedValue({
      data: mockApiKeys,
      error: null,
    });
  });
  
  it('renders the dashboard with user information', async () => {
    render(await DashboardPage());
    
    // Check welcome message
    expect(screen.getByText(/welcome to your dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    
    // Check recent jobs section
    expect(screen.getByText('Recent Jobs')).toBeInTheDocument();
    expect(screen.getByText('Test Job 1')).toBeInTheDocument();
    expect(screen.getByText('Test Job 2')).toBeInTheDocument();
    
    // Check API keys section
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.getByText('Test API Key 1')).toBeInTheDocument();
    expect(screen.getByText('Test API Key 2')).toBeInTheDocument();
    
    // Check action buttons
    expect(screen.getByText('Create New Job')).toBeInTheDocument();
    expect(screen.getByText('Create API Key')).toBeInTheDocument();
  });
  
  it('handles empty jobs and API keys', async () => {
    // Mock empty data
    (listJobs as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    
    (listApiKeys as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    
    render(await DashboardPage());
    
    // Check empty state messages
    expect(screen.getByText('No jobs found')).toBeInTheDocument();
    expect(screen.getByText('No API keys found')).toBeInTheDocument();
  });
  
  it('handles error fetching jobs', async () => {
    // Mock error for jobs
    (listJobs as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch jobs' },
    });
    
    render(await DashboardPage());
    
    // Check error message
    expect(screen.getByText('Error loading jobs')).toBeInTheDocument();
  });
  
  it('handles error fetching API keys', async () => {
    // Mock error for API keys
    (listApiKeys as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch API keys' },
    });
    
    render(await DashboardPage());
    
    // Check error message
    expect(screen.getByText('Error loading API keys')).toBeInTheDocument();
  });
});
