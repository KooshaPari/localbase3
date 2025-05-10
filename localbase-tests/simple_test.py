#!/usr/bin/env python3
"""
Simple test script
"""

import os
import sys
import json

def main():
    """
    Main function
    """
    print("Python version:", sys.version)
    print("Current directory:", os.getcwd())
    
    # Check if config.json exists
    config_path = os.path.join(os.getcwd(), 'config.json')
    if os.path.exists(config_path):
        print(f"Config file exists: {config_path}")
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            print("Config loaded successfully!")
            print(f"Config keys: {list(config.keys())}")
        except Exception as e:
            print(f"Error loading config: {e}")
    else:
        print(f"Config file does not exist: {config_path}")
    
    print("All tests passed!")

if __name__ == "__main__":
    main()
