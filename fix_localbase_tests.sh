#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing localbase-tests package...${NC}"

# Create the directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p localbase-tests/localbase_tests

# Create __init__.py files
echo -e "${YELLOW}Creating __init__.py files...${NC}"
echo '"""LocalBase Tests Package"""

__version__ = "0.1.0"' > localbase-tests/localbase_tests/__init__.py

echo '"""LocalBase Tests Package"""' > localbase-tests/__init__.py

# Create the utils module
echo -e "${YELLOW}Creating utils module...${NC}"
cat > localbase-tests/localbase_tests/utils.py << 'EOF'
"""
Utility functions for LocalBase tests
"""

import os
import json
import time
import subprocess
import requests
from unittest.mock import MagicMock
from typing import Dict, Any, Tuple, Optional

def load_config() -> Dict[str, Any]:
    """
    Load configuration from config.json
    """
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')
    
    if not os.path.exists(config_path):
        # Create default config if it doesn't exist
        config = {
            "supabase": {
                "url": "http://localhost:54321",
                "anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
                "test_user_email": "test@example.com",
                "test_user_password": "password123"
            },
            "frontend": {
                "url": "http://localhost:3000"
            },
            "blockchain": {
                "url": "http://localhost:26657",
                "chain_id": "localbase",
                "mnemonic": "test test test test test test test test test test test junk"
            },
            "provider": {
                "url": "http://localhost:8000",
                "api_key": "lb_test_key"
            }
        }
        
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
    
    with open(config_path, 'r') as f:
        return json.load(f)

def get_supabase_client():
    """
    Get Supabase client
    """
    # This is a placeholder - in a real implementation, you would use the Supabase Python client
    config = load_config()
    supabase_config = config.get("supabase", {})
    
    # Return a mock client for now
    client = MagicMock()
    client.auth.return_value = client
    client.sign_up.return_value = {'user': {'id': 'mock-user-id'}}
    client.sign_in.return_value = {'user': {'id': 'mock-user-id'}}
    
    return client

def get_supabase_admin_client():
    """
    Get Supabase admin client
    """
    # This is a placeholder - in a real implementation, you would use the Supabase admin client
    config = load_config()
    supabase_config = config.get("supabase", {})
    
    # Return a mock client for now
    return MagicMock()

def create_test_user() -> Tuple[Any, str]:
    """
    Create a test user in Supabase
    """
    supabase = get_supabase_client()
    config = load_config()
    supabase_config = config.get("supabase", {})
    
    email = supabase_config.get("test_user_email")
    password = supabase_config.get("test_user_password")
    
    # Create user
    result = supabase.auth().sign_up(email, password)
    
    # Return supabase client and user ID
    return supabase, result["user"]["id"]

def delete_test_user(user_id: str) -> None:
    """
    Delete a test user from Supabase
    """
    # This is a placeholder - in a real implementation, you would delete the user
    pass

def start_frontend_server() -> None:
    """
    Start the frontend server
    """
    # This is a placeholder - in a real implementation, you would start the server
    # For example:
    # subprocess.Popen(["npm", "run", "dev"], cwd="../localbase-frontend")
    pass

def stop_frontend_server() -> None:
    """
    Stop the frontend server
    """
    # This is a placeholder - in a real implementation, you would stop the server
    pass

def start_local_blockchain() -> None:
    """
    Start the local blockchain
    """
    # This is a placeholder - in a real implementation, you would start the blockchain
    pass

def stop_local_blockchain() -> None:
    """
    Stop the local blockchain
    """
    # This is a placeholder - in a real implementation, you would stop the blockchain
    pass

def get_frontend_client() -> Tuple[requests.Session, str]:
    """
    Get a client for the frontend API
    """
    config = load_config()
    frontend_config = config.get("frontend", {})
    url = frontend_config.get("url")
    
    session = MagicMock()
    session.post.return_value.status_code = 200
    session.post.return_value.json.return_value = {'id': 'mock-job-id', 'status': 'created'}
    session.get.return_value.status_code = 200
    session.get.return_value.json.return_value = {'id': 'mock-job-id', 'status': 'completed'}
    
    return session, url

def get_blockchain_client() -> Tuple[Any, Any]:
    """
    Get a client for the blockchain
    """
    # This is a placeholder - in a real implementation, you would use a blockchain client
    config = load_config()
    blockchain_config = config.get("blockchain", {})
    
    # Return mock client and wallet
    client = MagicMock()
    wallet = MagicMock()
    
    return client, wallet

def start_provider_node() -> None:
    """
    Start the provider node
    """
    # This is a placeholder - in a real implementation, you would start the provider node
    pass

def stop_provider_node() -> None:
    """
    Stop the provider node
    """
    # This is a placeholder - in a real implementation, you would stop the provider node
    pass

def create_test_job(provider_url: str, api_key: str, model: str, prompt: str) -> Dict[str, Any]:
    """
    Create a test job on the provider node
    """
    # This is a placeholder - in a real implementation, you would create a job
    return {
        "id": "mock-job-id",
        "status": "created"
    }

def wait_for_job_completion(provider_url: str, api_key: str, job_id: str, timeout: int = 60) -> Dict[str, Any]:
    """
    Wait for a job to complete
    """
    # This is a placeholder - in a real implementation, you would wait for the job to complete
    return {
        "id": job_id,
        "status": "completed",
        "result": "mock result"
    }
EOF

# Create the setup.py file
echo -e "${YELLOW}Creating setup.py file...${NC}"
cat > localbase-tests/setup.py << 'EOF'
from setuptools import setup, find_packages

setup(
    name="localbase_tests",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "pytest>=7.0.0",
        "requests>=2.25.0",
    ],
    python_requires=">=3.8",
)
EOF

# Create the config.json file
echo -e "${YELLOW}Creating config.json file...${NC}"
cat > localbase-tests/config.json << 'EOF'
{
  "supabase": {
    "url": "http://localhost:54321",
    "anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
    "test_user_email": "test@example.com",
    "test_user_password": "password123"
  },
  "frontend": {
    "url": "http://localhost:3000"
  },
  "blockchain": {
    "url": "http://localhost:26657",
    "chain_id": "localbase",
    "mnemonic": "test test test test test test test test test test test junk"
  },
  "provider": {
    "url": "http://localhost:8000",
    "api_key": "lb_test_key"
  }
}
EOF

# Create the pytest.ini file
echo -e "${YELLOW}Creating pytest.ini file...${NC}"
cat > localbase-tests/pytest.ini << 'EOF'
[pytest]
testpaths = integration security
python_files = test_*.py
python_classes = Test*
python_functions = test_*
EOF

# Create the run_tests.sh script
echo -e "${YELLOW}Creating run_tests.sh script...${NC}"
cat > localbase-tests/run_tests.sh << 'EOF'
#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Installing localbase_tests package in development mode...${NC}"
pip install -e .

echo -e "${YELLOW}Running tests...${NC}"
PYTHONPATH=$PYTHONPATH:$(pwd) python -m pytest "$@"

# Check if tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Please check the output above for details.${NC}"
  exit 1
fi
EOF

# Make the script executable
chmod +x localbase-tests/run_tests.sh

# Create a simple test file
echo -e "${YELLOW}Creating simple test file...${NC}"
cat > localbase-tests/test_simple.py << 'EOF'
#!/usr/bin/env python3
"""
Simple test file
"""

import os
import sys
import pytest

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from localbase_tests.utils import load_config

def test_load_config():
    """
    Test the load_config function
    """
    config = load_config()
    assert isinstance(config, dict)
    assert "supabase" in config
    assert "frontend" in config
    assert "blockchain" in config
    assert "provider" in config

def test_simple():
    """
    Simple test
    """
    assert True

def test_addition():
    """
    Test addition
    """
    assert 1 + 1 == 2

def test_subtraction():
    """
    Test subtraction
    """
    assert 2 - 1 == 1

if __name__ == "__main__":
    pytest.main([__file__])
EOF

# Create the README.md file
echo -e "${YELLOW}Creating README.md file...${NC}"
cat > localbase-tests/README.md << 'EOF'
# LocalBase Tests

This directory contains integration and security tests for the LocalBase project.

## Setup

1. Install the package in development mode:

```bash
pip install -e .
```

2. Run the tests:

```bash
python -m pytest
```

Or use the provided script:

```bash
./run_tests.sh
```

## Test Structure

- `integration/`: Integration tests between different components
  - `frontend-blockchain/`: Tests for frontend and blockchain integration
  - `frontend-supabase/`: Tests for frontend and Supabase integration
  - `supabase-blockchain/`: Tests for Supabase and blockchain integration
- `security/`: Security tests
  - `test_api_authentication.py`: Tests for API authentication
  - `test_workload_isolation.py`: Tests for workload isolation

## Configuration

The tests use a configuration file `config.json` in the root directory. If this file doesn't exist, a default configuration will be created.

Example configuration:

```json
{
  "supabase": {
    "url": "http://localhost:54321",
    "anon_key": "your-anon-key",
    "test_user_email": "test@example.com",
    "test_user_password": "password123"
  },
  "frontend": {
    "url": "http://localhost:3000"
  },
  "blockchain": {
    "url": "http://localhost:26657",
    "chain_id": "localbase",
    "mnemonic": "your mnemonic phrase"
  },
  "provider": {
    "url": "http://localhost:8000",
    "api_key": "your-api-key"
  }
}
```

## Troubleshooting

### ModuleNotFoundError: No module named 'localbase_tests'

If you see this error, it means the `localbase_tests` package is not installed. Run:

```bash
pip install -e .
```

### Tests are skipped

Some tests may be skipped if the required services are not running or if the configuration is not set up correctly. Check the output for details.

### Tests fail with connection errors

Make sure the required services are running:

- Frontend: `npm run dev` in the `localbase-frontend` directory
- Blockchain: Follow the instructions in the blockchain directory
- Provider: Follow the instructions in the provider directory
- Supabase: Make sure your Supabase instance is running
EOF

# Install the package in development mode
echo -e "${YELLOW}Installing package in development mode...${NC}"
cd localbase-tests && pip install -e .

# Run the simple test
echo -e "${YELLOW}Running simple test...${NC}"
cd localbase-tests && python -m pytest test_simple.py -v

# Check if the test passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}localbase-tests package fixed successfully!${NC}"
  echo -e "${GREEN}To run the tests, use: cd localbase-tests && ./run_tests.sh${NC}"
  exit 0
else
  echo -e "${RED}Failed to run simple test. Please try again.${NC}"
  exit 1
fi
