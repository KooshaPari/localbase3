import React from 'react';
import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'API Keys | LocalBase',
  description: 'Manage your LocalBase API keys',
};

export default async function ApiKeysPage() {
  // Create a Supabase client for server components
  const supabase = createServerComponentClient({ cookies });
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/signin');
  }
  
  // Get the user's API keys
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">API Keys</h1>
        
        <div className="mt-4 md:mt-0">
          <a
            href="/api-keys/new"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Create New API Key
          </a>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold">Your API Keys</h2>
          <p className="mt-2 text-gray-600">
            API keys allow you to authenticate requests to the LocalBase API. Keep your API keys secure and never share them publicly.
          </p>
          
          {apiKeys && apiKeys.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeys.map((apiKey) => (
                    <tr key={apiKey.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{apiKey.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {apiKey.key.substring(0, 8)}...
                          <button
                            className="ml-2 text-indigo-600 hover:text-indigo-900"
                            title="Copy to clipboard"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(apiKey.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <form action="/api/api-keys/delete" method="POST">
                          <input type="hidden" name="keyId" value={apiKey.id} />
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-900"
                            onClick={(e) => {
                              e.preventDefault();
                              if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
                                e.currentTarget.form?.submit();
                              }
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 mt-4 text-center bg-gray-50 rounded-md">
              <p className="text-gray-600">You don't have any API keys yet.</p>
              <a
                href="/api-keys/new"
                className="inline-block px-4 py-2 mt-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Create Your First API Key
              </a>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold">API Documentation</h2>
          <p className="mt-2 text-gray-600">
            Learn how to use the LocalBase API to access AI compute resources programmatically.
          </p>
          
          <div className="mt-4">
            <a
              href="/docs/api"
              className="text-indigo-600 hover:text-indigo-900"
            >
              View API Documentation →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
