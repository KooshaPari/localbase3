#!/usr/bin/env python3
"""
Script to fix all test files
"""

import os
import glob

def copy_utils_to_directories():
    """
    Copy the utils.py file to all test directories
    """
    source_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'localbase_tests', 'utils.py')
    
    # Get all directories containing test files
    test_dirs = set()
    for root, _, files in os.walk('.'):
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                test_dirs.add(root)
    
    # Copy the utils.py file to all test directories
    for test_dir in test_dirs:
        target_path = os.path.join(test_dir, 'utils.py')
        
        print(f"Copying utils module to {target_path}...")
        
        with open(source_path, 'r') as f:
            content = f.read()
        
        with open(target_path, 'w') as f:
            f.write(content)
        
        print(f"Copied utils module to {target_path}")

def fix_test_files():
    """
    Fix all test files
    """
    # Get all test files
    test_files = []
    for root, _, files in os.walk('.'):
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                test_files.append(os.path.join(root, file))
    
    # Fix all test files
    for file_path in test_files:
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

def main():
    """
    Main function
    """
    # Copy the utils.py file to all test directories
    copy_utils_to_directories()
    
    # Fix all test files
    fix_test_files()
    
    print("Done!")

if __name__ == "__main__":
    main()
