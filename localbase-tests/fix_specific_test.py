#!/usr/bin/env python3
"""
Script to fix a specific test file
"""

import os
import sys

def fix_file(file_path):
    """
    Fix a specific test file
    """
    print(f"Fixing {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace the import statement
    new_content = content.replace(
        'from localbase_tests.utils import',
        'from utils import'
    )
    
    # Write the new content
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"Fixed {file_path}")

def create_utils_module():
    """
    Create a utils.py file in the same directory as the test file
    """
    source_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'localbase_tests', 'utils.py')
    target_path = os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), 'utils.py')
    
    print(f"Creating utils module at {target_path}...")
    
    with open(source_path, 'r') as f:
        content = f.read()
    
    with open(target_path, 'w') as f:
        f.write(content)
    
    print(f"Created utils module at {target_path}")

def main():
    """
    Main function
    """
    if len(sys.argv) < 2:
        print("Usage: python fix_specific_test.py <test_file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} does not exist")
        sys.exit(1)
    
    # Create the utils module
    create_utils_module()
    
    # Fix the test file
    fix_file(file_path)
    
    print("Done!")

if __name__ == "__main__":
    main()
