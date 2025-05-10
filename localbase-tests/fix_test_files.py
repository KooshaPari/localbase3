#!/usr/bin/env python3
"""
Script to fix test files by replacing the import statements
"""

import os
import glob
import re

def fix_file(file_path):
    """
    Fix a test file by replacing the import statements
    """
    print(f"Fixing {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if the file already has the import fix
    if 'utils_module = os.path.join' in content:
        print(f"File already fixed: {file_path}")
        return
    
    # Find the import statement
    import_match = re.search(r'from localbase_tests\.utils import \([\s\S]*?\)', content)
    if not import_match:
        print(f"No import statement found in {file_path}")
        return
    
    import_statement = import_match.group(0)
    
    # Extract the imported functions
    functions_match = re.search(r'import \(([\s\S]*?)\)', import_statement)
    if not functions_match:
        print(f"No functions found in import statement in {file_path}")
        return
    
    functions_text = functions_match.group(1)
    functions = [f.strip() for f in functions_text.split(',') if f.strip()]
    
    # Create the new import statement
    new_import_statement = """import os
import sys
import importlib.util

# Load the utils module directly from the file
utils_module = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'localbase_tests', 'utils.py')
spec = importlib.util.spec_from_file_location('utils', utils_module)
utils = importlib.util.module_from_spec(spec)
spec.loader.exec_module(utils)

# Import the functions from the utils module
"""
    
    for function in functions:
        new_import_statement += f"{function} = utils.{function}\n"
    
    # Replace the import statement
    new_content = content.replace(import_statement, new_import_statement)
    
    # Write the new content
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"Fixed {file_path}")

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
    
    # Fix all test files
    for file_path in test_files:
        fix_file(file_path)
    
    print(f"Fixed {len(test_files)} test files")

if __name__ == "__main__":
    main()
