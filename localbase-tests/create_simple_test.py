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
    test_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_simple.py')
    
    print(f"Creating simple test file at {test_file}...")
    
    with open(test_file, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Simple test file
\"\"\"

import os
import sys
import pytest

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

def test_simple():
    \"\"\"
    Simple test
    \"\"\"
    assert True

if __name__ == "__main__":
    pytest.main([__file__])
""")
    
    print(f"Created simple test file at {test_file}")

if __name__ == "__main__":
    main()
