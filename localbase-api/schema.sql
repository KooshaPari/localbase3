-- LocalBase API Gateway Database Schema

-- Enable RLS (Row Level Security)
alter table auth.users enable row level security;

-- Create users table
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  active boolean not null default true,
  tier text not null default 'basic',
  balance numeric not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on users table
alter table public.users enable row level security;

-- Create API keys table
create table public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default 'Default API Key',
  active boolean not null default true,
  last_used timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone
);

-- Enable RLS on api_keys table
alter table public.api_keys enable row level security;

-- Create transactions table
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal', 'job_payment', 'refund')),
  amount numeric not null,
  balance_after numeric not null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  job_id uuid references public.jobs(id) on delete set null,
  provider_id text,
  blockchain_tx text,
  metadata jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on transactions table
alter table public.transactions enable row level security;

-- Create jobs table
create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  model text not null,
  provider_id text not null,
  input jsonb not null,
  parameters jsonb,
  result jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error text,
  blockchain_job_id text,
  usage jsonb,
  cost numeric,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  failed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on jobs table
alter table public.jobs enable row level security;

-- Create RLS policies

-- Users table policies
create policy "Users can view their own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own data" on public.users
  for update using (auth.uid() = id);

-- API keys table policies
create policy "Users can view their own API keys" on public.api_keys
  for select using (auth.uid() = user_id);

create policy "Users can create their own API keys" on public.api_keys
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own API keys" on public.api_keys
  for update using (auth.uid() = user_id);

create policy "Users can delete their own API keys" on public.api_keys
  for delete using (auth.uid() = user_id);

-- Transactions table policies
create policy "Users can view their own transactions" on public.transactions
  for select using (auth.uid() = user_id);

-- Jobs table policies
create policy "Users can view their own jobs" on public.jobs
  for select using (auth.uid() = user_id);

create policy "Users can create their own jobs" on public.jobs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own jobs" on public.jobs
  for update using (auth.uid() = user_id);

-- Create functions and triggers

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for users table
create trigger update_users_updated_at
before update on public.users
for each row execute function public.update_updated_at();

-- Trigger for transactions table
create trigger update_transactions_updated_at
before update on public.transactions
for each row execute function public.update_updated_at();

-- Trigger for jobs table
create trigger update_jobs_updated_at
before update on public.jobs
for each row execute function public.update_updated_at();
