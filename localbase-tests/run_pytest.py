#!/usr/bin/env python3
"""
Script to run a pytest test
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
    import pytest
    pytest.main([__file__])
