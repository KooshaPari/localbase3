import React from 'react';
import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CreateJobForm from '@/components/jobs/CreateJobForm';

export const metadata: Metadata = {
  title: 'Create Job | LocalBase',
  description: 'Create a new AI job on LocalBase',
};

export default async function CreateJobPage({
  searchParams,
}: {
  searchParams: { clone?: string };
}) {
  // Create a Supabase client for server components
  const supabase = createServerComponentClient({ cookies });
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/signin');
  }
  
  // Get all active models
  const { data: models } = await supabase
    .from('models')
    .select(`
      id,
      name,
      description,
      model_type,
      input_price_per_token,
      output_price_per_token,
      providers(id, name, region)
    `)
    .eq('status', 'active')
    .order('name');
  
  // If cloning a job, get the job details
  let cloneJob = null;
  if (searchParams.clone) {
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', searchParams.clone)
      .eq('user_id', session.user.id)
      .single();
    
    cloneJob = job;
  }
  
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
      
      <h1 className="text-3xl font-bold">
        {cloneJob ? 'Clone Job' : 'Create New Job'}
      </h1>
      
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6">
          <CreateJobForm 
            userId={session.user.id} 
            models={models || []} 
            cloneJob={cloneJob}
          />
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Job Guidelines</h2>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Model Selection</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Choose the appropriate model for your task. Different models have different capabilities and pricing.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Input Formatting</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Provide clear and concise input. The quality of your input directly affects the quality of the output.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Content Policy</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Do not submit content that violates our terms of service, including harmful, illegal, or unethical content.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Pricing</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Jobs are billed based on the number of input and output tokens. Different models have different pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
