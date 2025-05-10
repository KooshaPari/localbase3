import React from 'react';
import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Jobs | LocalBase',
  description: 'Manage your LocalBase jobs',
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  // Create a Supabase client for server components
  const supabase = createServerComponentClient({ cookies });
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/signin');
  }
  
  // Get query parameters
  const status = searchParams.status || 'all';
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 10;
  
  // Build the query
  let query = supabase
    .from('jobs')
    .select('*, models(name)', { count: 'exact' })
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  
  // Apply status filter
  if (status !== 'all') {
    query = query.eq('status', status);
  }
  
  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  
  // Execute the query
  const { data: jobs, count, error } = await query;
  
  // Calculate pagination info
  const totalPages = count ? Math.ceil(count / pageSize) : 0;
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Jobs</h1>
        
        <div className="mt-4 md:mt-0">
          <Link
            href="/jobs/new"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Create New Job
          </Link>
        </div>
      </div>
      
      {/* Status filter tabs */}
      <div className="mt-8 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <Link
            href="/jobs?status=all"
            className={`py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
              status === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Jobs
          </Link>
          <Link
            href="/jobs?status=pending"
            className={`py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
              status === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending
          </Link>
          <Link
            href="/jobs?status=processing"
            className={`py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
              status === 'processing'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Processing
          </Link>
          <Link
            href="/jobs?status=completed"
            className={`py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
              status === 'completed'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Completed
          </Link>
          <Link
            href="/jobs?status=failed"
            className={`py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
              status === 'failed'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Failed
          </Link>
        </nav>
      </div>
      
      {/* Jobs list */}
      {jobs && jobs.length > 0 ? (
        <div className="mt-6 overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link href={`/jobs/${job.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="font-medium text-indigo-600 truncate">
                          {job.models?.name || job.model_id}
                        </p>
                        <div className="ml-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            job.status === 'completed' ? 'bg-green-100 text-green-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
                          </svg>
                          ID: {job.id.substring(0, 8)}...
                        </p>
                        {job.input_tokens && job.output_tokens && (
                          <p className="flex items-center mt-2 text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2a1 1 0 011-1h8a1 1 0 011 1z" clipRule="evenodd" />
                            </svg>
                            {job.input_tokens + job.output_tokens} tokens
                          </p>
                        )}
                      </div>
                      <div className="flex items-center mt-2 text-sm text-gray-500 sm:mt-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <p>
                          Created {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-6 mt-6 text-center bg-white rounded-lg shadow-md">
          <p className="text-gray-600">
            {error
              ? 'Error loading jobs. Please try again.'
              : `No ${status !== 'all' ? status : ''} jobs found.`}
          </p>
          <Link
            href="/jobs/new"
            className="inline-block px-4 py-2 mt-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Create New Job
          </Link>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-6 bg-white border-t border-gray-200 sm:px-6 rounded-md">
          <div className="flex justify-between flex-1 sm:hidden">
            <Link
              href={`/jobs?status=${status}&page=${page > 1 ? page - 1 : 1}`}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${
                page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              Previous
            </Link>
            <Link
              href={`/jobs?status=${status}&page=${page < totalPages ? page + 1 : totalPages}`}
              className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${
                page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              Next
            </Link>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{from + 1}</span> to{' '}
                <span className="font-medium">{Math.min(to + 1, count || 0)}</span> of{' '}
                <span className="font-medium">{count}</span> results
              </p>
            </div>
            <div>
              <nav className="inline-flex -space-x-px rounded-md shadow-sm isolate" aria-label="Pagination">
                <Link
                  href={`/jobs?status=${status}&page=${page > 1 ? page - 1 : 1}`}
                  className={`relative inline-flex items-center px-2 py-2 text-gray-400 rounded-l-md ring-1 ring-inset ring-gray-300 ${
                    page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </Link>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Link
                    key={pageNum}
                    href={`/jobs?status=${status}&page=${pageNum}`}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      pageNum === page
                        ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </Link>
                ))}
                
                <Link
                  href={`/jobs?status=${status}&page=${page < totalPages ? page + 1 : totalPages}`}
                  className={`relative inline-flex items-center px-2 py-2 text-gray-400 rounded-r-md ring-1 ring-inset ring-gray-300 ${
                    page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
