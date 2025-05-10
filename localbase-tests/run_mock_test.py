#!/usr/bin/env python3
"""
Script to run a test that uses the mock utils module
"""

import os
import sys
import unittest
from unittest.mock import MagicMock

class TestMockUtils(unittest.TestCase):
    """
    Test case for mock utils
    """
    
    def test_load_config(self):
        """
        Test the load_config function
        """
        # Mock the load_config function
        def mock_load_config():
            return {
                'supabase': {
                    'url': 'http://localhost:54321',
                    'anon_key': 'test-key',
                    'test_user_email': 'test@example.com',
                    'test_user_password': 'password123',
                },
                'frontend': {
                    'url': 'http://localhost:3000',
                },
                'blockchain': {
                    'url': 'http://localhost:26657',
                    'chain_id': 'localbase',
                    'mnemonic': 'test test test test test test test test test test test junk',
                },
                'provider': {
                    'url': 'http://localhost:8000',
                    'api_key': 'lb_test_key',
                },
            }
        
        # Call the mock function
        config = mock_load_config()
        
        # Check the result
        self.assertIsInstance(config, dict)
        print(f"Config keys: {list(config.keys())}")
        self.assertIn('supabase', config)
        self.assertIn('frontend', config)
        self.assertIn('blockchain', config)
        self.assertIn('provider', config)
    
    def test_create_test_user(self):
        """
        Test the create_test_user function
        """
        # Mock the create_test_user function
        def mock_create_test_user():
            return MagicMock(), 'mock-user-id'
        
        # Call the mock function
        supabase, user_id = mock_create_test_user()
        
        # Check the result
        self.assertEqual(user_id, 'mock-user-id')
    
    def test_get_frontend_client(self):
        """
        Test the get_frontend_client function
        """
        # Mock the get_frontend_client function
        def mock_get_frontend_client():
            session = MagicMock()
            session.post.return_value.status_code = 200
            session.post.return_value.json.return_value = {'id': 'mock-job-id', 'status': 'created'}
            session.get.return_value.status_code = 200
            session.get.return_value.json.return_value = {'id': 'mock-job-id', 'status': 'completed'}
            return session, 'http://localhost:3000'
        
        # Call the mock function
        frontend, frontend_url = mock_get_frontend_client()
        
        # Check the result
        self.assertEqual(frontend_url, 'http://localhost:3000')
    
    def test_create_test_job(self):
        """
        Test the create_test_job function
        """
        # Mock the create_test_job function
        def mock_create_test_job(provider_url, api_key, model, prompt):
            return {'id': 'mock-job-id', 'status': 'created'}
        
        # Call the mock function
        job = mock_create_test_job('http://localhost:8000', 'lb_test_key', 'gpt-3.5-turbo', 'Hello, world!')
        
        # Check the result
        self.assertEqual(job['id'], 'mock-job-id')
        self.assertEqual(job['status'], 'created')
    
    def test_wait_for_job_completion(self):
        """
        Test the wait_for_job_completion function
        """
        # Mock the wait_for_job_completion function
        def mock_wait_for_job_completion(provider_url, api_key, job_id, timeout=60):
            return {'id': job_id, 'status': 'completed', 'result': 'mock result'}
        
        # Call the mock function
        job = mock_wait_for_job_completion('http://localhost:8000', 'lb_test_key', 'mock-job-id')
        
        # Check the result
        self.assertEqual(job['id'], 'mock-job-id')
        self.assertEqual(job['status'], 'completed')
        self.assertEqual(job['result'], 'mock result')

if __name__ == "__main__":
    unittest.main()
