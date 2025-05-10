import React from 'react';
import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CreateApiKeyForm from '@/components/api-keys/CreateApiKeyForm';

export const metadata: Metadata = {
  title: 'Create API Key | LocalBase',
  description: 'Create a new API key for LocalBase',
};

export default async function CreateApiKeyPage() {
  // Create a Supabase client for server components
  const supabase = createServerComponentClient({ cookies });
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/signin');
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center mb-8">
        <a href="/api-keys" className="flex items-center text-indigo-600 hover:text-indigo-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to API Keys
        </a>
      </div>
      
      <h1 className="text-3xl font-bold">Create New API Key</h1>
      
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6">
          <CreateApiKeyForm userId={session.user.id} />
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold">API Key Security</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Keep your API keys secure</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Your API keys carry many privileges, so be sure to keep them secure. Don't share your API keys in publicly accessible areas such as GitHub, client-side code, or social media.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">API key permissions</h3>
                <p className="mt-1 text-sm text-gray-600">
                  API keys have specific permissions that determine what actions they can perform. Choose the minimum permissions necessary for your use case.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Rotate your API keys regularly</h3>
                <p className="mt-1 text-sm text-gray-600">
                  We recommend rotating your API keys periodically to reduce the risk of exposed keys. When you rotate a key, you create a new key, update your applications to use the new key, and then delete the old key.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
