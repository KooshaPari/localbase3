#!/usr/bin/env python3
"""
Script to create a symbolic link to the localbase_tests package
"""

import os
import sys
import site

def main():
    """
    Main function
    """
    # Get the current directory
    current_dir = os.path.abspath(os.path.dirname(__file__))
    
    # Get the site-packages directory
    site_packages = site.getsitepackages()[0]
    
    # Create the symbolic link
    symlink_path = os.path.join(site_packages, 'localbase_tests')
    
    # Remove the symlink if it already exists
    if os.path.exists(symlink_path):
        if os.path.islink(symlink_path):
            os.unlink(symlink_path)
        else:
            print(f"Error: {symlink_path} exists but is not a symbolic link")
            sys.exit(1)
    
    # Create the symlink
    os.symlink(os.path.join(current_dir, 'localbase_tests'), symlink_path)
    
    print(f"Created symbolic link from {os.path.join(current_dir, 'localbase_tests')} to {symlink_path}")

if __name__ == "__main__":
    main()
