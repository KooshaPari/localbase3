#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Installing localbase_tests package in development mode...${NC}"
pip install -e .

echo -e "${YELLOW}Creating __init__.py files in test directories...${NC}"
touch integration/__init__.py
touch integration/frontend-blockchain/__init__.py
touch integration/frontend-supabase/__init__.py
touch integration/supabase-blockchain/__init__.py
touch security/__init__.py

echo -e "${YELLOW}Running tests...${NC}"
PYTHONPATH=$PYTHONPATH:$(pwd) python -m pytest -v

# Check if tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Please check the output above for details.${NC}"
  exit 1
fi
