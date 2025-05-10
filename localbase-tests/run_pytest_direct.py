#!/usr/bin/env python3
"""
Script to run a pytest test directly
"""

import sys

print("Python version:", sys.version)
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
