#!/bin/bash

# Start the Next.js development server in the background
echo "Starting Next.js development server..."
npm run dev &
NEXT_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 10

# Run Cypress tests
echo "Running Cypress tests..."
npx cypress run

# Store the exit code
EXIT_CODE=$?

# Kill the Next.js server
echo "Stopping Next.js development server..."
kill $NEXT_PID

# Exit with the Cypress exit code
exit $EXIT_CODE
