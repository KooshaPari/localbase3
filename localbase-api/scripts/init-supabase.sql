-- Create tables for LocalBase API

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  tier TEXT DEFAULT 'basic',
  balance DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '["read", "write"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Providers table
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  endpoint TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  models JSONB DEFAULT '[]'::jsonb,
  hardware JSONB,
  reputation DECIMAL DEFAULT 0,
  uptime DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id),
  model TEXT NOT NULL,
  input JSONB NOT NULL,
  parameters JSONB,
  result JSONB,
  error JSONB,
  status TEXT DEFAULT 'pending',
  cost DECIMAL,
  usage JSONB,
  blockchain_job_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE SET NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  balance_after DECIMAL NOT NULL,
  status TEXT DEFAULT 'completed',
  job_id UUID REFERENCES public.jobs(id),
  provider_id UUID REFERENCES public.providers(id),
  blockchain_tx TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE SET NULL
);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Create policies for API keys
CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for providers
CREATE POLICY "Anyone can view active providers" ON public.providers
  FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view their own providers" ON public.providers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own providers" ON public.providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own providers" ON public.providers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own providers" ON public.providers
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for jobs
CREATE POLICY "Users can view their own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Providers can view jobs assigned to them" ON public.jobs
  FOR SELECT USING (
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create their own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Providers can update jobs assigned to them" ON public.jobs
  FOR UPDATE USING (
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  );

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create test data for development
INSERT INTO public.users (name, email, active, tier, balance)
VALUES ('Test User', 'test@example.com', true, 'basic', 100)
ON CONFLICT (email) DO NOTHING;

-- Get the user ID for the test user
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM public.users WHERE email = 'test@example.com';
  
  -- Insert test API key
  INSERT INTO public.api_keys (user_id, key, name, active)
  VALUES (test_user_id, 'lb_sk_test123456789', 'Test API Key', true)
  ON CONFLICT DO NOTHING;
  
  -- Insert test provider
  INSERT INTO public.providers (user_id, name, description, endpoint, status, models)
  VALUES (
    test_user_id,
    'Test Provider',
    'A test provider for development',
    'http://localhost:3001',
    'active',
    '[{"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "price": 0.0015}, {"id": "gpt-4", "name": "GPT-4", "price": 0.03}]'::jsonb
  )
  ON CONFLICT DO NOTHING;
END $$;
