#!/usr/bin/env python3
"""
Script to create a simple test file
"""

import os

def main():
    """
    Main function
    """
    # Create a simple test file
    test_file = os.path.join(os.path.dirname(__file__), 'test_simple.py')
    
    with open(test_file, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Simple test file
\"\"\"

def test_simple():
    \"\"\"
    Simple test
    \"\"\"
    assert True

def test_addition():
    \"\"\"
    Test addition
    \"\"\"
    assert 1 + 1 == 2

def test_subtraction():
    \"\"\"
    Test subtraction
    \"\"\"
    assert 2 - 1 == 1
""")
    
    print(f"Created test file: {test_file}")
    
    # Create a run_test.sh script
    run_test_file = os.path.join(os.path.dirname(__file__), 'run_test.sh')
    
    with open(run_test_file, 'w') as f:
        f.write("""#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running tests...${NC}"

# Run the tests
python -m pytest test_simple.py -v

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
    os.chmod(run_test_file, 0o755)
    
    print(f"Created run script: {run_test_file}")
    print("To run the tests, use: ./run_test.sh")

if __name__ == "__main__":
    main()
