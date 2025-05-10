import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

// Mock the createServerComponentClient
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: jest.fn(),
}));

// Mock the redirect function
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock the cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (createServerComponentClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
        }),
      },
    });
  });
  
  it('renders the homepage correctly when user is not logged in', async () => {
    const { container } = render(await HomePage());
    
    // Check hero section
    expect(screen.getByText('Decentralized AI Compute Marketplace')).toBeInTheDocument();
    expect(screen.getByText(/access powerful ai models or monetize your gpu resources/i)).toBeInTheDocument();
    
    // Check call-to-action buttons
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learn more/i })).toBeInTheDocument();
    
    // Check features section
    expect(screen.getByText('Why Choose LocalBase?')).toBeInTheDocument();
    expect(screen.getByText('High Performance')).toBeInTheDocument();
    expect(screen.getByText('Decentralized Security')).toBeInTheDocument();
    expect(screen.getByText('Cost Effective')).toBeInTheDocument();
    
    // Check code example
    expect(screen.getByText(/localbase ai inference/i)).toBeInTheDocument();
    
    // Check footer
    expect(screen.getByText(/a decentralized marketplace for ai compute resources/i)).toBeInTheDocument();
    
    // Verify redirect was not called
    expect(redirect).not.toHaveBeenCalled();
  });
  
  it('redirects to dashboard when user is logged in', async () => {
    // Mock user session
    (createServerComponentClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { 
            session: { 
              user: { id: 'user123', email: 'test@example.com' } 
            } 
          },
        }),
      },
    });
    
    try {
      await HomePage();
    } catch (e) {
      // This will throw because we're testing a server component
      // but we just want to verify the redirect was called
    }
    
    // Verify redirect was called with correct path
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
});
