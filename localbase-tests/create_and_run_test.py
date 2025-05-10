#!/usr/bin/env python3
"""
Script to create a simple test file and run it directly
"""

import os
import sys
import subprocess

def main():
    """
    Main function
    """
    # Create a simple test file
    test_file = os.path.join(os.path.dirname(__file__), 'test_simple_direct.py')
    
    with open(test_file, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Simple test file
\"\"\"

def test_simple():
    \"\"\"
    Simple test
    \"\"\"
    print("Running test_simple")
    assert True
    print("test_simple passed")

def test_addition():
    \"\"\"
    Test addition
    \"\"\"
    print("Running test_addition")
    assert 1 + 1 == 2
    print("test_addition passed")

def test_subtraction():
    \"\"\"
    Test subtraction
    \"\"\"
    print("Running test_subtraction")
    assert 2 - 1 == 1
    print("test_subtraction passed")

if __name__ == "__main__":
    print("Running tests...")
    test_simple()
    test_addition()
    test_subtraction()
    print("All tests passed!")
""")
    
    print(f"Created test file: {test_file}")
    
    # Run the test file directly
    print("Running test file...")
    subprocess.check_call([sys.executable, test_file])
    
    print("All tests passed!")

if __name__ == "__main__":
    main()
