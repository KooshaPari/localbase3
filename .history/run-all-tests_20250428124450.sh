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
  
  echo -e "${YELLOW}Running tests for ${component}...${NC}"
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
  npm test -- --coverage
  
  # Check if tests passed
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ${component} tests passed!${NC}"
    return 0
  else
    echo -e "${RED}✗ ${component} tests failed!${NC}"
    return 1
  fi
}

# Main script
echo "========================================"
echo -e "${YELLOW}LocalBase Test Suite${NC}"
echo "========================================"

# Track overall success
OVERALL_SUCCESS=true

# Run frontend tests
run_tests "Frontend" "localbase-frontend"
if [ $? -ne 0 ]; then
  OVERALL_SUCCESS=false
fi

echo ""

# Run API tests
run_tests "API" "localbase-api"
if [ $? -ne 0 ]; then
  OVERALL_SUCCESS=false
fi

echo ""

# Run blockchain tests if they exist
if [ -d "localbase-blockchain" ]; then
  run_tests "Blockchain" "localbase-blockchain"
  if [ $? -ne 0 ]; then
    OVERALL_SUCCESS=false
  fi
  
  echo ""
fi

# Run provider tests if they exist
if [ -d "localbase-provider" ]; then
  run_tests "Provider" "localbase-provider"
  if [ $? -ne 0 ]; then
    OVERALL_SUCCESS=false
  fi
  
  echo ""
fi

# Run integration tests if they exist
if [ -d "localbase-tests" ]; then
  run_tests "Integration" "localbase-tests"
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
