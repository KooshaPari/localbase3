'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function createApiKey(userId: string, name: string, permissions: string[]) {
  try {
    const supabase = createServerActionClient({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || session.user.id !== userId) {
      return { error: 'Unauthorized', key: null };
    }
    
    // Generate a unique API key
    const apiKey = `lb_${uuidv4().replace(/-/g, '')}`;
    
    // Insert the API key into the database
    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        {
          user_id: userId,
          name,
          key: apiKey,
          permissions,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating API key:', error);
      return { error: error.message, key: null };
    }
    
    return { error: null, key: apiKey };
  } catch (err) {
    console.error('Unexpected error creating API key:', err);
    return { error: 'An unexpected error occurred', key: null };
  }
}

export async function deleteApiKey(keyId: string) {
  try {
    const supabase = createServerActionClient({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { error: 'Unauthorized' };
    }
    
    // Get the API key to verify ownership
    const { data: apiKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('id', keyId)
      .single();
    
    if (fetchError || !apiKey) {
      return { error: 'API key not found' };
    }
    
    // Verify the user owns the API key
    if (apiKey.user_id !== session.user.id) {
      return { error: 'Unauthorized' };
    }
    
    // Delete the API key
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);
    
    if (error) {
      console.error('Error deleting API key:', error);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.error('Unexpected error deleting API key:', err);
    return { error: 'An unexpected error occurred' };
  }
}
