import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  return { data, error };
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  
  return { data, error };
}

// User functions
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
}

export async function updateUserProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  return { data, error };
}

// API key management
export async function generateApiKey(userId: string, name: string, permissions: string[]) {
  const { data, error } = await supabase
    .from('api_keys')
    .insert([
      {
        user_id: userId,
        name,
        permissions,
        key: `lb_${crypto.randomUUID().replace(/-/g, '')}`,
        created_at: new Date().toISOString(),
      }
    ])
    .select()
    .single();
  
  return { data, error };
}

export async function listApiKeys(userId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function deleteApiKey(keyId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId);
  
  return { data, error };
}

// Provider functions
export async function registerProvider(userId: string, providerData: any) {
  const { data, error } = await supabase
    .from('providers')
    .insert([
      {
        user_id: userId,
        ...providerData,
        status: 'pending',
        created_at: new Date().toISOString(),
      }
    ])
    .select()
    .single();
  
  return { data, error };
}

export async function getProviderDetails(providerId: string) {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', providerId)
    .single();
  
  return { data, error };
}

// Job functions
export async function createJob(userId: string, jobData: any) {
  const { data, error } = await supabase
    .from('jobs')
    .insert([
      {
        user_id: userId,
        ...jobData,
        status: 'pending',
        created_at: new Date().toISOString(),
      }
    ])
    .select()
    .single();
  
  return { data, error };
}

export async function listJobs(userId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getJobDetails(jobId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  
  return { data, error };
}
