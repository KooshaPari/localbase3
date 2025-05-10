import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const jobId = formData.get('jobId') as string;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the job to verify ownership
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('user_id, status')
      .eq('id', jobId)
      .single();
    
    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Verify the user owns the job
    if (job.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Verify the job is in a cancellable state
    if (job.status !== 'pending') {
      return NextResponse.json(
        { error: 'Job cannot be cancelled in its current state' },
        { status: 400 }
      );
    }
    
    // Update the job status
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'failed', error: 'Cancelled by user' })
      .eq('id', jobId);
    
    if (error) {
      console.error('Error cancelling job:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Redirect back to the job detail page
    return NextResponse.redirect(new URL(`/jobs/${jobId}`, request.url));
  } catch (err) {
    console.error('Unexpected error cancelling job:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
