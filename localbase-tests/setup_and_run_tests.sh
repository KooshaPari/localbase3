#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up LocalBase tests...${NC}"

# Create __init__.py files in all directories
echo -e "${YELLOW}Creating __init__.py files in test directories...${NC}"
mkdir -p integration/frontend-blockchain
mkdir -p integration/frontend-supabase
mkdir -p integration/supabase-blockchain
mkdir -p security

touch integration/__init__.py
touch integration/frontend-blockchain/__init__.py
touch integration/frontend-supabase/__init__.py
touch integration/supabase-blockchain/__init__.py
touch security/__init__.py

# Install the package in development mode
echo -e "${YELLOW}Installing localbase_tests package in development mode...${NC}"
pip install -e .

# Create a simple test script to verify imports
echo -e "${YELLOW}Creating test script...${NC}"
cat > test_imports.py << 'EOF'
#!/usr/bin/env python3
"""
Test script to check if imports are working
"""

import sys
import os

try:
    from localbase_tests.utils import (
        load_config,
        get_supabase_client,
        get_supabase_admin_client,
        create_test_user,
        delete_test_user,
        start_frontend_server,
        stop_frontend_server,
        start_local_blockchain,
        stop_local_blockchain,
        get_frontend_client,
        get_blockchain_client,
        start_provider_node,
        stop_provider_node,
        create_test_job,
        wait_for_job_completion,
    )
    print("All imports successful!")
    
    # Test loading config
    config = load_config()
    print("Config loaded successfully!")
    print(f"Config keys: {list(config.keys())}")
    
    print("All tests passed!")
    
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
EOF

# Run the test script
echo -e "${YELLOW}Running test script...${NC}"
python test_imports.py

# Check if the test script passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Test script passed!${NC}"
else
  echo -e "${RED}Test script failed. Please check the output above for details.${NC}"
  exit 1
fi

# Run the tests
echo -e "${YELLOW}Running tests...${NC}"
python -m pytest -v

# Check if tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Please check the output above for details.${NC}"
  exit 1
fi
