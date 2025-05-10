#!/usr/bin/env python3
"""
Direct test file
"""

def test_simple():
    """
    Simple test
    """
    assert True

def test_addition():
    """
    Test addition
    """
    assert 1 + 1 == 2

def test_subtraction():
    """
    Test subtraction
    """
    assert 2 - 1 == 1

if __name__ == "__main__":
    print("Running tests...")
    test_simple()
    test_addition()
    test_subtraction()
    print("All tests passed!")
