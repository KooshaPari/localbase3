#!/usr/bin/env python3
"""
Script to modify all test files to use mocks
"""

import os
import re
import glob

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

def modify_test_file(file_path):
    """
    Modify a test file to use the mock utils module
    """
    print(f"Modifying {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace the import statement
    new_content = re.sub(
        r'from localbase_tests\.utils import \([\s\S]*?\)',
        'from mock_utils import (\n    load_config,\n    get_supabase_client,\n    get_supabase_admin_client,\n    create_test_user,\n    delete_test_user,\n    start_frontend_server,\n    stop_frontend_server,\n    start_local_blockchain,\n    stop_local_blockchain,\n    get_frontend_client,\n    get_blockchain_client,\n    start_provider_node,\n    stop_provider_node,\n    create_test_job,\n    wait_for_job_completion,\n)',
        content
    )
    
    # Write the new content
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"Modified {file_path}")

def main():
    """
    Main function
    """
    # Create the mock utils module
    create_mock_utils()
    
    # Get all test files
    test_files = []
    for root, _, files in os.walk('.'):
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                test_files.append(os.path.join(root, file))
    
    # Modify all test files
    for file_path in test_files:
        modify_test_file(file_path)
    
    print(f"Modified {len(test_files)} test files")

if __name__ == "__main__":
    main()
