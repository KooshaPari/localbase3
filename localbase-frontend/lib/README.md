# localbase-frontend/lib

Supabase integration for localbase-frontend authentication, user management, and API operations.

## Overview

This library provides a typed wrapper around Supabase for the localbase-frontend application. It handles:

- **Authentication**: Sign up, sign in, sign out, password management
- **User Profiles**: Profile retrieval and updates
- **API Keys**: Generation, listing, and deletion of API keys
- **Providers**: Registration and retrieval of LLM provider configurations
- **Jobs**: Job creation, listing, and details

## Installation

Requires the following environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

See `.env.example` in the project root for reference.

## Usage

```typescript
import {
  signIn,
  signOut,
  supabase,
  getUserProfile,
  updateUserProfile,
  generateApiKey,
  listJobs,
  type UserProfile,
  type ProviderData,
  type JobData,
} from './lib';

// Sign in
const { data, error } = await signIn(email, password);

// Get current user
const user = await getCurrentUser();

// Manage profile
const profile = await getUserProfile(user.id);
await updateUserProfile(user.id, { name: 'New Name' });

// Generate API key
const { data: apiKey } = await generateApiKey(user.id, 'My Key', ['read']);

// Register a provider
const providerData: ProviderData = {
  name: 'openai',
  type: 'openai',
  config: { api_key: 'sk-...' },
};
await registerProvider(user.id, providerData);

// Create a job
const jobData: JobData = {
  name: 'my-job',
  model: 'gpt-4',
  prompt: 'Hello world',
};
await createJob(user.id, jobData);
```

## TypeScript Interfaces

### UserProfile

```typescript
interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  [key: string]: string | number | undefined;
}
```

### ProviderData

```typescript
interface ProviderData {
  name?: string;
  type?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}
```

### JobData

```typescript
interface JobData {
  name?: string;
  model?: string;
  prompt?: string;
  status?: string;
  [key: string]: unknown;
}
```

## Database Tables

The library expects the following Supabase tables:

- `profiles` - User profile data
- `api_keys` - API key storage
- `providers` - LLM provider configurations
- `jobs` - Job tracking

## Architecture

The library uses a lazy-initialized Supabase client that validates environment variables on first access rather than at module load time. This allows the application to build without requiring environment variables to be present during build.

```typescript
// The supabase client is created lazily
const { data } = await supabase.auth.getUser();
```

## Files

- `index.ts` - Barrel export re-exporting all public APIs
- `supabase.ts` - Core Supabase client and all functions/types
