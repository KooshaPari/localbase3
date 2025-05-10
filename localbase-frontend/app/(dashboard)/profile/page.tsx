import React from 'react';
import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Profile | LocalBase',
  description: 'Manage your LocalBase profile',
};

export default async function ProfilePage() {
  // Create a Supabase client for server components
  const supabase = createServerComponentClient({ cookies });
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/signin');
  }
  
  // Get the user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-3xl font-bold">Your Profile</h1>
      
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="flex items-center justify-center w-24 h-24 text-2xl font-bold text-indigo-600 bg-indigo-100 rounded-full">
                {profile?.full_name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold">{profile?.full_name || 'User'}</h2>
              <p className="mt-1 text-gray-600">{session.user.email}</p>
              <p className="mt-1 text-gray-600">
                Account Type: {profile?.is_provider ? 'Provider' : 'User'}
              </p>
              <p className="mt-1 text-gray-600">
                Member since: {new Date(session.user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Account Information</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50">
                  {session.user.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50">
                  {profile?.full_name || 'Not set'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Provider Status</label>
                <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50">
                  {profile?.is_provider ? 'Active Provider' : 'Not a Provider'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col mt-8 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <a
              href="/profile/edit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Edit Profile
            </a>
            <a
              href="/change-password"
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50"
            >
              Change Password
            </a>
            {!profile?.is_provider && (
              <a
                href="/provider/register"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Become a Provider
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Account Security Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold">Account Security</h3>
          
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Two-Factor Authentication</label>
              <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50">
                Not enabled
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Sign In</label>
              <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50">
                {new Date(session.user.last_sign_in_at || '').toLocaleString() || 'Unknown'}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <a
              href="/security"
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50"
            >
              Manage Security Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
