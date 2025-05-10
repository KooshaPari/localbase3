#!/usr/bin/env python3
"""
Script to create a test file that uses the mock utils module
"""

import os

def create_mock_utils():
    """
    Create a mock utils module
    """
    mock_utils_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mock_utils.py')
    
    print(f"Creating mock utils module at {mock_utils_file}...")
    
    with open(mock_utils_file, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Mock utils module for tests
\"\"\"

from unittest.mock import MagicMock

def load_config():
    \"\"\"
    Load configuration
    \"\"\"
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

def get_supabase_client():
    \"\"\"
    Get Supabase client
    \"\"\"
    client = MagicMock()
    client.auth.return_value = client
    client.sign_up.return_value = {'user': {'id': 'mock-user-id'}}
    client.sign_in.return_value = {'user': {'id': 'mock-user-id'}}
    return client

def get_supabase_admin_client():
    \"\"\"
    Get Supabase admin client
    \"\"\"
    return MagicMock()

def create_test_user():
    \"\"\"
    Create a test user
    \"\"\"
    return get_supabase_client(), 'mock-user-id'

def delete_test_user(user_id):
    \"\"\"
    Delete a test user
    \"\"\"
    pass

def start_frontend_server():
    \"\"\"
    Start the frontend server
    \"\"\"
    pass

def stop_frontend_server():
    \"\"\"
    Stop the frontend server
    \"\"\"
    pass

def start_local_blockchain():
    \"\"\"
    Start the local blockchain
    \"\"\"
    pass

def stop_local_blockchain():
    \"\"\"
    Stop the local blockchain
    \"\"\"
    pass

def get_frontend_client():
    \"\"\"
    Get a client for the frontend API
    \"\"\"
    session = MagicMock()
    session.post.return_value.status_code = 200
    session.post.return_value.json.return_value = {'id': 'mock-job-id', 'status': 'created'}
    session.get.return_value.status_code = 200
    session.get.return_value.json.return_value = {'id': 'mock-job-id', 'status': 'completed'}
    return session, 'http://localhost:3000'

def get_blockchain_client():
    \"\"\"
    Get a client for the blockchain
    \"\"\"
    client = MagicMock()
    wallet = MagicMock()
    return client, wallet

def start_provider_node():
    \"\"\"
    Start the provider node
    \"\"\"
    pass

def stop_provider_node():
    \"\"\"
    Stop the provider node
    \"\"\"
    pass

def create_test_job(provider_url, api_key, model, prompt):
    \"\"\"
    Create a test job
    \"\"\"
    return {'id': 'mock-job-id', 'status': 'created'}

def wait_for_job_completion(provider_url, api_key, job_id, timeout=60):
    \"\"\"
    Wait for a job to complete
    \"\"\"
    return {'id': job_id, 'status': 'completed', 'result': 'mock result'}
""")
    
    print(f"Created mock utils module at {mock_utils_file}")

def create_test_file():
    """
    Create a test file that uses the mock utils module
    """
    test_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_mock_utils.py')
    
    print(f"Creating test file at {test_file}...")
    
    with open(test_file, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Test file that uses the mock utils module
\"\"\"

import os
import sys
import pytest

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from mock_utils import (
    load_config,
    get_supabase_client,
    get_supabase_admin_client,
    create_test_user,
    delete_test_user,
    start_frontend_server,
    stop_frontend_server,
    start_local_blockchain,
    stop_local_blockchain,
    get_frontend_client,
    get_blockchain_client,
    start_provider_node,
    stop_provider_node,
    create_test_job,
    wait_for_job_completion,
)

def test_load_config():
    \"\"\"
    Test the load_config function
    \"\"\"
    config = load_config()
    assert isinstance(config, dict)
    print(f"Config keys: {list(config.keys())}")
    assert 'supabase' in config
    assert 'frontend' in config
    assert 'blockchain' in config
    assert 'provider' in config

def test_create_test_user():
    \"\"\"
    Test the create_test_user function
    \"\"\"
    supabase, user_id = create_test_user()
    assert user_id == 'mock-user-id'

def test_get_frontend_client():
    \"\"\"
    Test the get_frontend_client function
    \"\"\"
    frontend, frontend_url = get_frontend_client()
    assert frontend_url == 'http://localhost:3000'

def test_create_test_job():
    \"\"\"
    Test the create_test_job function
    \"\"\"
    job = create_test_job('http://localhost:8000', 'lb_test_key', 'gpt-3.5-turbo', 'Hello, world!')
    assert job['id'] == 'mock-job-id'
    assert job['status'] == 'created'

def test_wait_for_job_completion():
    \"\"\"
    Test the wait_for_job_completion function
    \"\"\"
    job = wait_for_job_completion('http://localhost:8000', 'lb_test_key', 'mock-job-id')
    assert job['id'] == 'mock-job-id'
    assert job['status'] == 'completed'
    assert job['result'] == 'mock result'

if __name__ == "__main__":
    pytest.main([__file__])
""")
    
    print(f"Created test file at {test_file}")

def main():
    """
    Main function
    """
    # Create the mock utils module
    create_mock_utils()
    
    # Create the test file
    create_test_file()
    
    print("Done!")

if __name__ == "__main__":
    main()
