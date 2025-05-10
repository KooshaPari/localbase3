import React from 'react';
import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Job ${params.id.substring(0, 8)} | LocalBase`,
    description: 'View job details and results',
  };
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const jobId = params.id;
  
  // Create a Supabase client for server components
  const supabase = createServerComponentClient({ cookies });
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/signin');
  }
  
  // Get the job details
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      models(name, description),
      providers(name, region)
    `)
    .eq('id', jobId)
    .eq('user_id', session.user.id)
    .single();
  
  // If job not found, show 404
  if (error || !job) {
    notFound();
  }
  
  // Format the job status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center mb-8">
        <Link href="/jobs" className="flex items-center text-indigo-600 hover:text-indigo-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Jobs
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Details</h1>
          <p className="mt-1 text-gray-600">ID: {job.id}</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(job.status)}`}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-3">
        {/* Job Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Job Information</h2>
            </div>
            <div className="px-6 py-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Model</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.models?.name || job.model_id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Provider</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.providers?.name || job.provider_id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date(job.created_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Input Tokens</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.input_tokens || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Output Tokens</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.output_tokens || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cost</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {job.cost ? `$${job.cost.toFixed(6)}` : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Region</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.providers?.region || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Input */}
          <div className="mt-6 bg-white rounded-lg shadow-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Input</h2>
            </div>
            <div className="px-6 py-5">
              <div className="p-4 overflow-auto font-mono text-sm bg-gray-100 rounded-md whitespace-pre-wrap max-h-60">
                {job.input}
              </div>
              
              {job.parameters && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">Parameters</h3>
                  <div className="p-4 mt-2 overflow-auto font-mono text-sm bg-gray-100 rounded-md whitespace-pre-wrap max-h-40">
                    {JSON.stringify(job.parameters, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Output */}
          <div className="mt-6 bg-white rounded-lg shadow-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Output</h2>
            </div>
            <div className="px-6 py-5">
              {job.status === 'completed' ? (
                <div className="p-4 overflow-auto font-mono text-sm bg-gray-100 rounded-md whitespace-pre-wrap max-h-96">
                  {job.output}
                </div>
              ) : job.status === 'failed' ? (
                <div className="p-4 text-red-700 bg-red-100 rounded-md">
                  <p className="font-medium">Error:</p>
                  <p className="mt-1">{job.error || 'An unknown error occurred'}</p>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {job.status === 'processing' ? 'Job is currently processing...' : 'Job is pending...'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions and Related Information */}
        <div>
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Actions</h2>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-4">
                <Link
                  href={`/jobs/new?clone=${job.id}`}
                  className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Clone Job
                </Link>
                
                {job.status === 'pending' && (
                  <form action="/api/jobs/cancel" method="POST">
                    <input type="hidden" name="jobId" value={job.id} />
                    <button
                      type="submit"
                      className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50"
                    >
                      Cancel Job
                    </button>
                  </form>
                )}
                
                {job.status === 'completed' && (
                  <button
                    type="button"
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50"
                    onClick={() => {
                      navigator.clipboard.writeText(job.output || '');
                      alert('Output copied to clipboard');
                    }}
                  >
                    Copy Output
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Model Information */}
          <div className="mt-6 bg-white rounded-lg shadow-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Model Information</h2>
            </div>
            <div className="px-6 py-5">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.models?.name || job.model_id}</dd>
                </div>
                {job.models?.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{job.models.description}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Provider</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.providers?.name || job.provider_id}</dd>
                </div>
              </dl>
              
              <div className="mt-6">
                <Link
                  href={`/models/${job.model_id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                >
                  View Model Details →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
