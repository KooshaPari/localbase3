#!/usr/bin/env python3
"""
Script to check if the localbase_tests package can be imported
"""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    import localbase_tests
    print(f"localbase_tests package imported successfully! Path: {localbase_tests.__file__}")
except ImportError as e:
    print(f"Error importing localbase_tests package: {e}")
    sys.exit(1)
