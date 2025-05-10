#!/usr/bin/env python3
"""
Script to fix the import issues in the test files
"""

import os
import sys
import glob
import re
import shutil

def create_init_files():
    """
    Create __init__.py files in all directories
    """
    print("Creating __init__.py files in all directories...")
    
    # Create __init__.py in the root directory
    with open(os.path.join(os.path.dirname(__file__), '__init__.py'), 'w') as f:
        f.write('"""LocalBase Tests Package"""\n')
    
    # Create __init__.py in all subdirectories
    for root, dirs, _ in os.walk(os.path.dirname(__file__)):
        for dir_name in dirs:
            init_file = os.path.join(root, dir_name, '__init__.py')
            if not os.path.exists(init_file):
                with open(init_file, 'w') as f:
                    f.write('"""LocalBase Tests Package"""\n')
    
    print("Created __init__.py files in all directories")

def copy_utils_to_test_dirs():
    """
    Copy the utils.py file to all test directories
    """
    print("Copying utils.py to all test directories...")
    
    # Get the source utils.py file
    utils_file = os.path.join(os.path.dirname(__file__), 'localbase_tests', 'utils.py')
    
    if not os.path.exists(utils_file):
        print(f"Error: utils.py file not found at {utils_file}")
        return
    
    # Get all test directories
    test_dirs = set()
    for root, _, files in os.walk(os.path.dirname(__file__)):
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                test_dirs.add(root)
    
    # Copy utils.py to all test directories
    for test_dir in test_dirs:
        target_file = os.path.join(test_dir, 'utils.py')
        shutil.copy2(utils_file, target_file)
        print(f"Copied utils.py to {test_dir}")
    
    print("Copied utils.py to all test directories")

def fix_imports_in_test_files():
    """
    Fix the import statements in all test files
    """
    print("Fixing import statements in all test files...")
    
    # Get all test files
    test_files = []
    for root, _, files in os.walk(os.path.dirname(__file__)):
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                test_files.append(os.path.join(root, file))
    
    # Fix import statements in all test files
    for test_file in test_files:
        print(f"Fixing import statements in {test_file}...")
        
        with open(test_file, 'r') as f:
            content = f.read()
        
        # Replace the import statement
        new_content = re.sub(
            r'from localbase_tests\.utils import',
            'from utils import',
            content
        )
        
        with open(test_file, 'w') as f:
            f.write(new_content)
        
        print(f"Fixed import statements in {test_file}")
    
    print("Fixed import statements in all test files")

def create_setup_py():
    """
    Create a setup.py file
    """
    print("Creating setup.py file...")
    
    setup_file = os.path.join(os.path.dirname(__file__), 'setup.py')
    
    with open(setup_file, 'w') as f:
        f.write("""from setuptools import setup, find_packages

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
""")
    
    print("Created setup.py file")

def create_pytest_ini():
    """
    Create a pytest.ini file
    """
    print("Creating pytest.ini file...")
    
    pytest_ini_file = os.path.join(os.path.dirname(__file__), 'pytest.ini')
    
    with open(pytest_ini_file, 'w') as f:
        f.write("""[pytest]
testpaths = integration security
python_files = test_*.py
python_classes = Test*
python_functions = test_*
""")
    
    print("Created pytest.ini file")

def create_run_tests_script():
    """
    Create a run_tests.sh script
    """
    print("Creating run_tests.sh script...")
    
    run_tests_file = os.path.join(os.path.dirname(__file__), 'run_tests.sh')
    
    with open(run_tests_file, 'w') as f:
        f.write("""#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running tests...${NC}"

# Run the tests
python -m pytest "$@"

# Check if tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Please check the output above for details.${NC}"
  exit 1
fi
""")
    
    # Make the script executable
    os.chmod(run_tests_file, 0o755)
    
    print("Created run_tests.sh script")

def create_readme():
    """
    Create a README.md file
    """
    print("Creating README.md file...")
    
    readme_file = os.path.join(os.path.dirname(__file__), 'README.md')
    
    with open(readme_file, 'w') as f:
        f.write("""# LocalBase Tests

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
""")
    
    print("Created README.md file")

def main():
    """
    Main function
    """
    print("Fixing tests...")
    
    # Create __init__.py files in all directories
    create_init_files()
    
    # Copy utils.py to all test directories
    copy_utils_to_test_dirs()
    
    # Fix import statements in all test files
    fix_imports_in_test_files()
    
    # Create setup.py file
    create_setup_py()
    
    # Create pytest.ini file
    create_pytest_ini()
    
    # Create run_tests.sh script
    create_run_tests_script()
    
    # Create README.md file
    create_readme()
    
    print("Tests fixed successfully!")
    print("To run the tests, use: ./run_tests.sh")

if __name__ == "__main__":
    main()
