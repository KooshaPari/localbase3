-- LocalBase API Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  api_key TEXT UNIQUE,
  api_key_created_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{"models": ["*"], "rate_limit": 100}'::JSONB
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  input JSONB NOT NULL,
  parameters JSONB,
  result JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  usage JSONB,
  cost NUMERIC(20, 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  blockchain_job_id TEXT,
  blockchain_tx_hash TEXT
);

-- Create index on jobs
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_provider_id ON jobs(provider_id);
CREATE INDEX IF NOT EXISTS idx_jobs_model_id ON jobs(model_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Usage statistics table
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  date DATE NOT NULL,
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  cost NUMERIC(20, 10) DEFAULT 0,
  job_count INTEGER DEFAULT 0,
  UNIQUE(user_id, model_id, provider_id, date)
);

-- Create index on usage_stats
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON usage_stats(date);

-- Provider cache table
CREATE TABLE IF NOT EXISTS provider_cache (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hardware_info JSONB NOT NULL,
  benchmark_results JSONB NOT NULL,
  models_supported TEXT[] NOT NULL,
  pricing JSONB NOT NULL,
  status TEXT NOT NULL,
  region TEXT NOT NULL,
  avg_response_time INTEGER NOT NULL,
  reputation NUMERIC(5, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on provider_cache
CREATE INDEX IF NOT EXISTS idx_provider_cache_models ON provider_cache USING GIN(models_supported);
CREATE INDEX IF NOT EXISTS idx_provider_cache_region ON provider_cache(region);
CREATE INDEX IF NOT EXISTS idx_provider_cache_status ON provider_cache(status);

-- Model cache table
CREATE TABLE IF NOT EXISTS model_cache (
  id TEXT PRIMARY KEY,
  object TEXT NOT NULL DEFAULT 'model',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  owned_by TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create function to update usage statistics
CREATE OR REPLACE FUNCTION update_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process completed jobs
  IF NEW.status = 'completed' AND NEW.usage IS NOT NULL THEN
    INSERT INTO usage_stats (
      user_id, 
      model_id, 
      provider_id, 
      date, 
      input_tokens, 
      output_tokens, 
      cost, 
      job_count
    )
    VALUES (
      NEW.user_id,
      NEW.model_id,
      NEW.provider_id,
      CURRENT_DATE,
      (NEW.usage->>'input_tokens')::BIGINT,
      (NEW.usage->>'output_tokens')::BIGINT,
      NEW.cost,
      1
    )
    ON CONFLICT (user_id, model_id, provider_id, date)
    DO UPDATE SET
      input_tokens = usage_stats.input_tokens + (NEW.usage->>'input_tokens')::BIGINT,
      output_tokens = usage_stats.output_tokens + (NEW.usage->>'output_tokens')::BIGINT,
      cost = usage_stats.cost + NEW.cost,
      job_count = usage_stats.job_count + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating usage statistics
CREATE TRIGGER update_job_usage_stats
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_usage_stats();

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY users_policy ON users
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can only see and modify their own API keys
CREATE POLICY api_keys_policy ON api_keys
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only see and modify their own jobs
CREATE POLICY jobs_policy ON jobs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only see their own usage stats
CREATE POLICY usage_stats_policy ON usage_stats
  USING (user_id = auth.uid());

-- Provider cache and model cache are public read-only
ALTER TABLE provider_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY provider_cache_policy ON provider_cache
  USING (TRUE);

CREATE POLICY model_cache_policy ON model_cache
  USING (TRUE);
