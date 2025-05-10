#!/usr/bin/env python3
"""
Script to create a very simple test file
"""

import os

def main():
    """
    Main function
    """
    # Create a very simple test file
    test_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_very_simple.py')
    
    print(f"Creating very simple test file at {test_file}...")
    
    with open(test_file, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Very simple test file
\"\"\"

def test_very_simple():
    \"\"\"
    Very simple test
    \"\"\"
    assert True
""")
    
    print(f"Created very simple test file at {test_file}")

if __name__ == "__main__":
    main()
