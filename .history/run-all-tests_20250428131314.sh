#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to run tests for a specific component
run_tests() {
  local component=$1
  local dir=$2
  local test_type=$3
  local test_command=$4

  echo -e "${YELLOW}Running ${test_type} tests for ${component}...${NC}"
  echo "========================================"

  # Change to the component directory
  cd $dir

  # Check if package.json exists
  if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found in ${dir}${NC}"
    return 1
  fi

  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
  fi

  # Run tests
  npm run $test_command

  # Check if tests passed
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ${component} ${test_type} tests passed!${NC}"
    return 0
  else
    echo -e "${RED}✗ ${component} ${test_type} tests failed!${NC}"
    return 1
  fi
}

# Main script
echo "========================================"
echo -e "${YELLOW}LocalBase Test Suite${NC}"
echo "========================================"

# Track overall success
OVERALL_SUCCESS=true

# Run frontend unit tests
run_tests "Frontend" "localbase-frontend" "unit" "test"
if [ $? -ne 0 ]; then
  OVERALL_SUCCESS=false
fi

echo ""

# Run frontend end-to-end tests
run_tests "Frontend" "localbase-frontend" "end-to-end" "test:e2e"
if [ $? -ne 0 ]; then
  OVERALL_SUCCESS=false
fi

echo ""

# Run frontend accessibility tests
run_tests "Frontend" "localbase-frontend" "accessibility" "test:accessibility"
if [ $? -ne 0 ]; then
  OVERALL_SUCCESS=false
fi

echo ""

# Run frontend performance tests
run_tests "Frontend" "localbase-frontend" "performance" "test:performance"
if [ $? -ne 0 ]; then
  OVERALL_SUCCESS=false
fi

echo ""

# Run API unit tests
run_tests "API" "localbase-api" "unit" "test"
if [ $? -ne 0 ]; then
  OVERALL_SUCCESS=false
fi

echo ""

# Run API load tests
run_tests "API" "localbase-api" "load" "test:load"
if [ $? -ne 0 ]; then
  OVERALL_SUCCESS=false
fi

echo ""

# Run blockchain tests if they exist
if [ -d "localbase-blockchain" ]; then
  run_tests "Blockchain" "localbase-blockchain" "unit" "test"
  if [ $? -ne 0 ]; then
    OVERALL_SUCCESS=false
  fi

  echo ""
fi

# Run provider tests if they exist
if [ -d "localbase-provider" ]; then
  run_tests "Provider" "localbase-provider" "unit" "test"
  if [ $? -ne 0 ]; then
    OVERALL_SUCCESS=false
  fi

  echo ""
fi

# Run integration tests if they exist
if [ -d "localbase-tests" ]; then
  run_tests "Integration" "localbase-tests" "unit" "test"
  if [ $? -ne 0 ]; then
    OVERALL_SUCCESS=false
  fi

  echo ""
fi

# Print overall result
echo "========================================"
if [ "$OVERALL_SUCCESS" = true ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Please check the output above for details.${NC}"
  exit 1
fi
