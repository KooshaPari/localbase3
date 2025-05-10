'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface CreateJobParams {
  userId: string;
  modelId: string;
  providerId: string;
  input: string;
  parameters: {
    max_tokens: number;
    temperature: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  };
}

export async function createJob(params: CreateJobParams) {
  try {
    const supabase = createServerActionClient({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || session.user.id !== params.userId) {
      return { error: 'Unauthorized', jobId: null };
    }
    
    // Verify model exists and is active
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('*')
      .eq('id', params.modelId)
      .eq('status', 'active')
      .single();
    
    if (modelError || !model) {
      return { error: 'Selected model not found or is not active', jobId: null };
    }
    
    // Verify provider exists and is active
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('id', params.providerId)
      .eq('status', 'active')
      .single();
    
    if (providerError || !provider) {
      return { error: 'Selected provider not found or is not active', jobId: null };
    }
    
    // Create the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert([
        {
          user_id: params.userId,
          model_id: params.modelId,
          provider_id: params.providerId,
          input: params.input,
          parameters: params.parameters,
          status: 'pending',
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();
    
    if (jobError) {
      console.error('Error creating job:', jobError);
      return { error: jobError.message, jobId: null };
    }
    
    // TODO: In a real implementation, we would send the job to the provider node
    // For now, we'll simulate this by updating the job status after a delay
    setTimeout(async () => {
      await simulateJobProcessing(job.id);
    }, 5000);
    
    return { error: null, jobId: job.id };
  } catch (err) {
    console.error('Unexpected error creating job:', err);
    return { error: 'An unexpected error occurred', jobId: null };
  }
}

export async function cancelJob(jobId: string) {
  try {
    const supabase = createServerActionClient({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { error: 'Unauthorized' };
    }
    
    // Get the job to verify ownership
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('user_id, status')
      .eq('id', jobId)
      .single();
    
    if (fetchError || !job) {
      return { error: 'Job not found' };
    }
    
    // Verify the user owns the job
    if (job.user_id !== session.user.id) {
      return { error: 'Unauthorized' };
    }
    
    // Verify the job is in a cancellable state
    if (job.status !== 'pending') {
      return { error: 'Job cannot be cancelled in its current state' };
    }
    
    // Update the job status
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'failed', error: 'Cancelled by user' })
      .eq('id', jobId);
    
    if (error) {
      console.error('Error cancelling job:', error);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.error('Unexpected error cancelling job:', err);
    return { error: 'An unexpected error occurred' };
  }
}

// Helper function to simulate job processing
async function simulateJobProcessing(jobId: string) {
  const supabase = createServerActionClient({ cookies });
  
  try {
    // Update job to processing
    await supabase
      .from('jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Get the job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (!job) {
      return;
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Generate a response based on the input
    const input = job.input;
    let output = '';
    
    if (input.includes('?')) {
      output = `Here is the answer to your question: "${input}"\n\nThe answer depends on various factors, but I'll provide a comprehensive explanation.\n\n`;
      output += `First, let's consider the key aspects of your question. There are several important elements to address:\n\n`;
      output += `1. The primary consideration is understanding the context\n`;
      output += `2. We need to analyze the underlying assumptions\n`;
      output += `3. It's important to consider different perspectives\n\n`;
      output += `Based on these considerations, I would conclude that the most appropriate response is to approach this question with a balanced view that takes into account multiple factors and avoids oversimplification.`;
    } else {
      output = `Here is a response to your input: "${input}"\n\n`;
      output += `I've analyzed your request and prepared the following information:\n\n`;
      output += `The topic you've mentioned is quite interesting and has several important aspects to consider. Let me elaborate on a few key points:\n\n`;
      output += `1. Historical context is essential for understanding this topic\n`;
      output += `2. Current research suggests several promising directions\n`;
      output += `3. Future implications could be significant in multiple domains\n\n`;
      output += `I hope this information is helpful. Please let me know if you need any clarification or have additional questions.`;
    }
    
    // Calculate tokens (simplified)
    const inputTokens = Math.ceil(input.length / 4);
    const outputTokens = Math.ceil(output.length / 4);
    
    // Calculate cost (simplified)
    const { data: model } = await supabase
      .from('models')
      .select('input_price_per_token, output_price_per_token')
      .eq('id', job.model_id)
      .single();
    
    let cost = 0;
    if (model) {
      const inputCost = inputTokens * (model.input_price_per_token || 0);
      const outputCost = outputTokens * (model.output_price_per_token || 0);
      cost = inputCost + outputCost;
    }
    
    // Update job with results
    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        output,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  } catch (error) {
    console.error('Error simulating job processing:', error);
    
    // Update job as failed
    await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error: 'An error occurred during processing',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}
