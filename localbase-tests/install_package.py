#!/usr/bin/env python3
"""
Script to install the localbase_tests package in development mode
"""

import os
import sys
import subprocess

def main():
    """
    Main function
    """
    # Get the current directory
    current_dir = os.path.abspath(os.path.dirname(__file__))
    
    # Install the package in development mode
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-e', current_dir])
        print("Package installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error installing package: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
