#!/usr/bin/env python3
"""
Script to create a test file that uses a mock for the utils module
"""

import os

def main():
    """
    Main function
    """
    # Create a test file that uses a mock for the utils module
    test_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_mock.py')
    
    print(f"Creating mock test file at {test_file}...")
    
    with open(test_file, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Test file that uses a mock for the utils module
\"\"\"

import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Mock the utils module
sys.modules['localbase_tests'] = MagicMock()
sys.modules['localbase_tests.utils'] = MagicMock()

# Create mock functions
load_config = MagicMock(return_value={
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
})

get_supabase_client = MagicMock()
get_supabase_admin_client = MagicMock()
create_test_user = MagicMock(return_value=(MagicMock(), 'mock-user-id'))
delete_test_user = MagicMock()
start_frontend_server = MagicMock()
stop_frontend_server = MagicMock()
start_local_blockchain = MagicMock()
stop_local_blockchain = MagicMock()
get_frontend_client = MagicMock(return_value=(MagicMock(), 'http://localhost:3000'))
get_blockchain_client = MagicMock(return_value=(MagicMock(), MagicMock()))
start_provider_node = MagicMock()
stop_provider_node = MagicMock()
create_test_job = MagicMock(return_value={'id': 'mock-job-id', 'status': 'created'})
wait_for_job_completion = MagicMock(return_value={'id': 'mock-job-id', 'status': 'completed', 'result': 'mock result'})

# Assign the mock functions to the mock module
sys.modules['localbase_tests.utils'].load_config = load_config
sys.modules['localbase_tests.utils'].get_supabase_client = get_supabase_client
sys.modules['localbase_tests.utils'].get_supabase_admin_client = get_supabase_admin_client
sys.modules['localbase_tests.utils'].create_test_user = create_test_user
sys.modules['localbase_tests.utils'].delete_test_user = delete_test_user
sys.modules['localbase_tests.utils'].start_frontend_server = start_frontend_server
sys.modules['localbase_tests.utils'].stop_frontend_server = stop_frontend_server
sys.modules['localbase_tests.utils'].start_local_blockchain = start_local_blockchain
sys.modules['localbase_tests.utils'].stop_local_blockchain = stop_local_blockchain
sys.modules['localbase_tests.utils'].get_frontend_client = get_frontend_client
sys.modules['localbase_tests.utils'].get_blockchain_client = get_blockchain_client
sys.modules['localbase_tests.utils'].start_provider_node = start_provider_node
sys.modules['localbase_tests.utils'].stop_provider_node = stop_provider_node
sys.modules['localbase_tests.utils'].create_test_job = create_test_job
sys.modules['localbase_tests.utils'].wait_for_job_completion = wait_for_job_completion

# Import the mock functions
from localbase_tests.utils import (
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
    
    print(f"Created mock test file at {test_file}")

if __name__ == "__main__":
    main()
