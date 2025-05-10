#!/usr/bin/env python3
"""
Script to fix imports in test files
"""

import os
import re
import glob

def fix_imports(file_path):
    """
    Fix imports in a file
    """
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if the file already has the import fix
    if 'import sys' in content and 'sys.path.insert' in content:
        print(f"File already fixed: {file_path}")
        return
    
    # Find the import statement
    import_match = re.search(r'from localbase_tests\.utils import \([\s\S]*?\)', content)
    if not import_match:
        print(f"No import statement found in {file_path}")
        return
    
    import_statement = import_match.group(0)
    
    # Create the new import statement
    new_import_statement = """import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

""" + import_statement
    
    # Replace the import statement
    new_content = content.replace(import_statement, new_import_statement)
    
    # Write the new content
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"Fixed imports in {file_path}")

def main():
    """
    Main function
    """
    # Get all test files
    test_files = glob.glob('integration/**/test_*.py', recursive=True)
    test_files.extend(glob.glob('security/test_*.py'))
    
    # Fix imports in all test files
    for file_path in test_files:
        fix_imports(file_path)
    
    print("All imports fixed!")

if __name__ == "__main__":
    main()
