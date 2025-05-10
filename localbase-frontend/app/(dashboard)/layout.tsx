import React from 'react';
import Navigation from '@/components/layout/Navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a Supabase client for server components
  const supabase = createServerComponentClient({ cookies });
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/signin');
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      <footer className="py-6 bg-white border-t">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600">
                &copy; {new Date().getFullYear()} LocalBase. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                Terms of Service
              </a>
              <a href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                Privacy Policy
              </a>
              <a href="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
