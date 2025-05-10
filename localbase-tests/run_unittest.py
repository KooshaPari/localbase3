#!/usr/bin/env python3
"""
Script to run a unittest test
"""

import unittest

class TestSimple(unittest.TestCase):
    """
    Simple test case
    """
    
    def test_simple(self):
        """
        Simple test
        """
        self.assertTrue(True)
    
    def test_addition(self):
        """
        Test addition
        """
        self.assertEqual(1 + 1, 2)
    
    def test_subtraction(self):
        """
        Test subtraction
        """
        self.assertEqual(2 - 1, 1)

if __name__ == "__main__":
    unittest.main()
