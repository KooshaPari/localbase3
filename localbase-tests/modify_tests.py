#!/usr/bin/env python3
"""
Script to modify test files to use relative imports
"""

import os
import glob

def modify_file(file_path):
    """
    Modify a file to use relative imports
    """
    print(f"Modifying {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace the import statement
    modified_content = content.replace(
        'from localbase_tests.utils import',
        'from ..localbase_tests.utils import'
    )
    
    with open(file_path, 'w') as f:
        f.write(modified_content)
    
    print(f"Modified {file_path}")

def main():
    """
    Main function
    """
    # Get all test files
    test_files = []
    for root, _, files in os.walk('.'):
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                test_files.append(os.path.join(root, file))
    
    # Modify all test files
    for file_path in test_files:
        modify_file(file_path)
    
    print(f"Modified {len(test_files)} test files")

if __name__ == "__main__":
    main()
