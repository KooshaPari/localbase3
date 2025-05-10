#!/usr/bin/env python3
"""
Script to run a specific test file with the correct Python path
"""

import os
import sys
import subprocess

def main():
    """
    Main function
    """
    if len(sys.argv) < 2:
        print("Usage: python run_test.py <test_file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} does not exist")
        sys.exit(1)
    
    # Get the current directory
    current_dir = os.path.abspath(os.path.dirname(__file__))
    
    # Set the PYTHONPATH environment variable
    env = os.environ.copy()
    env['PYTHONPATH'] = current_dir
    
    # Run the test file
    print(f"Running {file_path}...")
    
    try:
        subprocess.check_call([sys.executable, '-m', 'pytest', file_path, '-v'], env=env)
        print(f"Test {file_path} passed!")
    except subprocess.CalledProcessError as e:
        print(f"Test {file_path} failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
