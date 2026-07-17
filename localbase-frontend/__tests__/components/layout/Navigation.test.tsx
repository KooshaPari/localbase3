import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '@/components/layout/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the usePathname hook
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Navigation', () => {
  const mockSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: mockSignOut,
    });

    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('renders the navigation with user logged in', () => {
    render(<Navigation />);

    // Check logo is present
    expect(screen.getByText('LocalBase')).toBeInTheDocument();

    // Check navigation links appear at least once (desktop + mobile)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Jobs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('API Keys').length).toBeGreaterThanOrEqual(1);

    // Check user menu
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('highlights the active navigation item', () => {
    (usePathname as jest.Mock).mockReturnValue('/jobs');

    render(<Navigation />);

    // Desktop dashboard link (first one) should not be highlighted
    const dashboardLinks = screen.getAllByText('Dashboard');
    const desktopDashboardLink = dashboardLinks[0].closest('a');
    expect(desktopDashboardLink).not.toHaveClass('bg-indigo-700');

    // Desktop jobs link should be highlighted
    const jobsLinks = screen.getAllByText('Jobs');
    const desktopJobsLink = jobsLinks[0].closest('a');
    expect(desktopJobsLink).toHaveClass('bg-indigo-700');
  });

  it('renders the mobile menu toggle button', () => {
    render(<Navigation />);

    // Mobile menu button should be present
    const mobileButtons = screen.getAllByRole('button');
    const menuButton = mobileButtons.find(
      (btn) => btn.querySelector('.sr-only')?.textContent === 'Open main menu'
    );
    expect(menuButton).toBeInTheDocument();
  });

  it('renders user dropdown menu for logged in users', () => {
    render(<Navigation />);

    // User dropdown is rendered (always present in DOM for logged-in users)
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Sign out buttons appear in both desktop dropdown and mobile section
    const signOutButtons = screen.getAllByText('Sign out');
    expect(signOutButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls signOut when a sign out button is clicked', () => {
    render(<Navigation />);

    // Click the first sign out button
    const signOutButtons = screen.getAllByText('Sign out');
    fireEvent.click(signOutButtons[0]);

    // Verify signOut was called
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('renders without user when not logged in', () => {
    // Mock user as null (not logged in)
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      signOut: mockSignOut,
    });

    render(<Navigation />);

    // Check logo is present
    expect(screen.getByText('LocalBase')).toBeInTheDocument();

    // User email should not be present
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();

    // Sign in and Sign up links appear at least once (desktop + mobile)
    expect(screen.getAllByText('Sign in').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sign up').length).toBeGreaterThanOrEqual(1);
  });
});
