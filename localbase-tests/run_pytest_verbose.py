#!/usr/bin/env python3
"""
Script to run a pytest test with verbose output
"""

import sys

def test_simple():
    """
    Simple test
    """
    print("Running test_simple")
    assert True
    print("test_simple passed")

def test_addition():
    """
    Test addition
    """
    print("Running test_addition")
    assert 1 + 1 == 2
    print("test_addition passed")

def test_subtraction():
    """
    Test subtraction
    """
    print("Running test_subtraction")
    assert 2 - 1 == 1
    print("test_subtraction passed")

if __name__ == "__main__":
    print("Python version:", sys.version)
    print("Running tests...")
    
    # Run the tests manually
    test_simple()
    test_addition()
    test_subtraction()
    
    print("All tests passed!")
