#!/bin/bash

# Start the LocalBase API Gateway

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Set default port if not specified
PORT=${PORT:-3000}

# Start the server
echo "Starting LocalBase API Gateway on port $PORT..."
node server.js
