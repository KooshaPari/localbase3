#!/bin/bash

# Navigate to the frontend directory
cd localbase-frontend

# Check if pages/index.tsx exists and remove it
if [ -f "pages/index.tsx" ]; then
  echo "Removing pages/index.tsx to use App Router..."
  rm pages/index.tsx
  echo "File removed successfully."
else
  echo "pages/index.tsx does not exist."
fi

# Check if both directories exist
if [ -d "pages" ] && [ -d "app" ]; then
  echo "Both 'pages' and 'app' directories exist."
  echo "Using App Router (app directory) for routing."
elif [ -d "pages" ]; then
  echo "Only 'pages' directory exists. Using Pages Router."
elif [ -d "app" ]; then
  echo "Only 'app' directory exists. Using App Router."
else
  echo "Neither 'pages' nor 'app' directory exists. Please check your project structure."
fi

echo "Conflict resolution complete. You can now try building your project again."
