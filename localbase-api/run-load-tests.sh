#!/bin/bash

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
  echo "k6 is not installed. Please install it first:"
  echo "  - macOS: brew install k6"
  echo "  - Linux: follow instructions at https://k6.io/docs/getting-started/installation/"
  exit 1
fi

# Start the API server in the background
echo "Starting API server..."
npm run dev &
API_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 10

# Create a directory for the reports
mkdir -p load-test-reports

# Run the load test
echo "Running load test..."
k6 run --out json=load-test-reports/results.json load-tests/api-load-test.js

# Store the exit code
EXIT_CODE=$?

# Kill the API server
echo "Stopping API server..."
kill $API_PID

# Generate a summary report
echo "Generating summary report..."
cat > load-test-reports/summary.txt << EOF
Load Test Summary
================

Date: $(date)

Performance Metrics:
-------------------
EOF

# Extract key metrics from the JSON report
jq -r '
  "Requests per second: " + (.metrics.http_reqs.rate | tostring) + "\n" +
  "Average response time: " + (.metrics.http_req_duration.avg | tostring) + "ms\n" +
  "95th percentile response time: " + (.metrics.http_req_duration.p95 | tostring) + "ms\n" +
  "99th percentile response time: " + (.metrics.http_req_duration.p99 | tostring) + "ms\n" +
  "Success rate: " + (.metrics.success_rate.rate | tostring) + "%\n" +
  "Total requests: " + (.metrics.http_reqs.count | tostring) + "\n" +
  "Failed requests: " + (.metrics.errors.count | tostring) + "\n"
' load-test-reports/results.json >> load-test-reports/summary.txt

echo "Load test summary:"
cat load-test-reports/summary.txt

# Exit with the k6 exit code
exit $EXIT_CODE
