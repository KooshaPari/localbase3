#!/usr/bin/env python3
"""
Script to create a simple test file and run it directly
"""

import os
import sys

def main():
    """
    Main function
    """
    print("Running tests...")
    print("Running test_simple")
    assert True
    print("test_simple passed")
    
    print("Running test_addition")
    assert 1 + 1 == 2
    print("test_addition passed")
    
    print("Running test_subtraction")
    assert 2 - 1 == 1
    print("test_subtraction passed")
    
    print("All tests passed!")

if __name__ == "__main__":
    main()
