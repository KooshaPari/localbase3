-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_provider BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  hardware_info JSONB NOT NULL,
  benchmark_results JSONB,
  models_supported TEXT[] DEFAULT '{}',
  pricing JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'suspended')),
  region TEXT,
  avg_response_time BIGINT,
  reputation NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  model_type TEXT NOT NULL,
  version TEXT NOT NULL,
  parameters BIGINT,
  input_price_per_token NUMERIC DEFAULT 0,
  output_price_per_token NUMERIC DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, name, version)
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  provider_id UUID REFERENCES providers(id) NOT NULL,
  model_id UUID REFERENCES models(id) NOT NULL,
  input TEXT NOT NULL,
  parameters JSONB,
  output TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create billing table
CREATE TABLE IF NOT EXISTS billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method TEXT,
  payment_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credits table
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method TEXT,
  payout_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies

-- Profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Providers policies
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active providers"
  ON providers FOR SELECT
  USING (status = 'active');

CREATE POLICY "Providers can view their own provider details"
  ON providers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can update their own provider details"
  ON providers FOR UPDATE
  USING (auth.uid() = user_id);

-- Models policies
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active models"
  ON models FOR SELECT
  USING (status = 'active');

CREATE POLICY "Providers can view their own models"
  ON models FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM providers
    WHERE providers.id = models.provider_id
    AND providers.user_id = auth.uid()
  ));

CREATE POLICY "Providers can update their own models"
  ON models FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM providers
    WHERE providers.id = models.provider_id
    AND providers.user_id = auth.uid()
  ));

-- Jobs policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can view jobs assigned to them"
  ON jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM providers
    WHERE providers.id = jobs.provider_id
    AND providers.user_id = auth.uid()
  ));

-- API keys policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Billing policies
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing"
  ON billing FOR SELECT
  USING (auth.uid() = user_id);

-- Credits policies
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
  ON credits FOR SELECT
  USING (auth.uid() = user_id);

-- Payouts policies
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own payouts"
  ON payouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM providers
    WHERE providers.id = payouts.provider_id
    AND providers.user_id = auth.uid()
  ));

-- Create functions and triggers

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_providers_timestamp
  BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_models_timestamp
  BEFORE UPDATE ON models
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_billing_timestamp
  BEFORE UPDATE ON billing
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
