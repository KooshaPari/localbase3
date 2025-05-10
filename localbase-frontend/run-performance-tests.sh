#!/bin/bash

# Start the Next.js development server in the background
echo "Starting Next.js development server..."
npm run dev &
NEXT_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 10

# Create a directory for the reports
mkdir -p lighthouse-reports

# Run Lighthouse tests
echo "Running Lighthouse tests..."

# Test the homepage
npx lighthouse http://localhost:3000 \
  --config-path=lighthouse-config.js \
  --output=html,json \
  --output-path=lighthouse-reports/homepage \
  --chrome-flags="--headless --no-sandbox --disable-gpu"

# Test the sign-in page
npx lighthouse http://localhost:3000/signin \
  --config-path=lighthouse-config.js \
  --output=html,json \
  --output-path=lighthouse-reports/signin \
  --chrome-flags="--headless --no-sandbox --disable-gpu"

# Test the sign-up page
npx lighthouse http://localhost:3000/signup \
  --config-path=lighthouse-config.js \
  --output=html,json \
  --output-path=lighthouse-reports/signup \
  --chrome-flags="--headless --no-sandbox --disable-gpu"

# Kill the Next.js server
echo "Stopping Next.js development server..."
kill $NEXT_PID

# Print a summary of the results
echo "Performance test results:"
echo "------------------------"
echo "Homepage:"
jq '.categories.performance.score * 100' lighthouse-reports/homepage.report.json
echo "Sign-in page:"
jq '.categories.performance.score * 100' lighthouse-reports/signin.report.json
echo "Sign-up page:"
jq '.categories.performance.score * 100' lighthouse-reports/signup.report.json

echo "Accessibility test results:"
echo "--------------------------"
echo "Homepage:"
jq '.categories.accessibility.score * 100' lighthouse-reports/homepage.report.json
echo "Sign-in page:"
jq '.categories.accessibility.score * 100' lighthouse-reports/signin.report.json
echo "Sign-up page:"
jq '.categories.accessibility.score * 100' lighthouse-reports/signup.report.json

echo "Best Practices test results:"
echo "---------------------------"
echo "Homepage:"
jq '.categories["best-practices"].score * 100' lighthouse-reports/homepage.report.json
echo "Sign-in page:"
jq '.categories["best-practices"].score * 100' lighthouse-reports/signin.report.json
echo "Sign-up page:"
jq '.categories["best-practices"].score * 100' lighthouse-reports/signup.report.json

echo "SEO test results:"
echo "----------------"
echo "Homepage:"
jq '.categories.seo.score * 100' lighthouse-reports/homepage.report.json
echo "Sign-in page:"
jq '.categories.seo.score * 100' lighthouse-reports/signin.report.json
echo "Sign-up page:"
jq '.categories.seo.score * 100' lighthouse-reports/signup.report.json

echo "Performance test reports generated in lighthouse-reports directory."
