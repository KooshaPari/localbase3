#!/usr/bin/env python3
"""
Script to create a test file that imports the utils module
"""

import os

def main():
    """
    Main function
    """
    # Create a test file that imports the utils module
    test_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_utils.py')
    
    print(f"Creating utils test file at {test_file}...")
    
    with open(test_file, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Test file that imports the utils module
\"\"\"

import os
import sys
import pytest

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    from localbase_tests.utils import load_config
    print("Successfully imported load_config from localbase_tests.utils")
except ImportError as e:
    print(f"Error importing load_config from localbase_tests.utils: {e}")
    sys.exit(1)

def test_load_config():
    \"\"\"
    Test the load_config function
    \"\"\"
    config = load_config()
    assert isinstance(config, dict)
    print(f"Config keys: {list(config.keys())}")

if __name__ == "__main__":
    pytest.main([__file__])
""")
    
    print(f"Created utils test file at {test_file}")

if __name__ == "__main__":
    main()
