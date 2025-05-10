#!/bin/bash

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Start Supabase if not already running
echo "Starting Supabase..."
supabase start

# Wait for Supabase to be ready
echo "Waiting for Supabase to be ready..."
sleep 5

# Get the Supabase URL and key
SUPABASE_URL=$(supabase status | grep 'API URL' | awk '{print $3}')
SUPABASE_KEY=$(supabase status | grep 'anon key' | awk '{print $3}')
SUPABASE_SERVICE_KEY=$(supabase status | grep 'service_role key' | awk '{print $3}')

echo "Supabase URL: $SUPABASE_URL"
echo "Supabase Anon Key: $SUPABASE_KEY"
echo "Supabase Service Key: $SUPABASE_SERVICE_KEY"

# Initialize the database schema
echo "Initializing database schema..."
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f ./scripts/init-supabase.sql

echo "Supabase setup complete!"
echo "You can now run the API with: npm start"
