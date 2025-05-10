# LocalBase Tests

This directory contains integration and security tests for the LocalBase project.

## Test Structure

- `integration/`: Integration tests between different components
  - `frontend-supabase/`: Tests for frontend and Supabase integration
  - `frontend-blockchain/`: Tests for frontend and blockchain integration
  - `supabase-blockchain/`: Tests for Supabase and blockchain integration
- `security/`: Security tests for the provider node
  - `test_workload_isolation.py`: Tests for workload isolation
  - `test_api_authentication.py`: Tests for API authentication

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Configure the tests by editing `config.json`:

```json
{
  "supabase": {
    "url": "http://localhost:54321",
    "anon_key": "your-anon-key",
    "service_role_key": "your-service-role-key",
    "test_user_email": "test@example.com",
    "test_user_password": "password123"
  },
  "blockchain": {
    "chain_id": "localbase-testnet-1",
    "rpc_endpoint": "http://localhost:26657",
    "rest_endpoint": "http://localhost:1317",
    "test_mnemonic": "your test mnemonic",
    "provider_contract": "contract-address",
    "job_contract": "contract-address"
  },
  "frontend": {
    "url": "http://localhost:3000",
    "api_url": "http://localhost:3000/api"
  },
  "provider": {
    "url": "http://localhost:8000",
    "api_key": "your-api-key"
  }
}
```

## Running Tests

### Run all tests:

```bash
python run_tests.py
```

### Run specific test types:

```bash
# Run integration tests
python run_tests.py --test-type integration

# Run security tests
python run_tests.py --test-type security
```

### Run specific test modules:

```bash
# Run frontend-supabase integration tests
python run_tests.py --test-type integration --test-module frontend-supabase

# Run workload isolation security tests
python run_tests.py --test-type security --test-module test_workload_isolation.py
```

### Verbose output:

```bash
python run_tests.py --verbose
```

### Custom configuration:

```bash
python run_tests.py --config custom-config.json
```

## Test Utilities

The `utils.py` file contains utility functions for the tests:

- `load_config()`: Load test configuration
- `get_supabase_client()`: Get Supabase client
- `get_supabase_admin_client()`: Get Supabase admin client
- `create_test_user()`: Create a test user in Supabase
- `delete_test_user()`: Delete a test user from Supabase
- `start_local_blockchain()`: Start a local blockchain for testing
- `stop_local_blockchain()`: Stop the local blockchain
- `start_local_supabase()`: Start a local Supabase instance for testing
- `stop_local_supabase()`: Stop the local Supabase instance
- `start_frontend_server()`: Start the frontend server for testing
- `stop_frontend_server()`: Stop the frontend server
- `start_provider_node()`: Start the provider node for testing
- `stop_provider_node()`: Stop the provider node
- `wait_for_job_completion()`: Wait for a job to complete
- `create_test_job()`: Create a test job
- `get_blockchain_client()`: Get blockchain client
- `get_frontend_client()`: Get frontend client

## Adding New Tests

1. Create a new test file in the appropriate directory
2. Import the necessary utilities from `utils.py`
3. Use pytest fixtures for setup and teardown
4. Run the tests using the test runner

Example:

```python
import pytest
from localbase_tests.utils import (
    load_config,
    get_supabase_client,
    create_test_user,
    delete_test_user,
)

@pytest.fixture(scope="module")
def setup():
    """
    Set up test environment
    """
    # Create test user
    supabase, user_id = create_test_user()
    
    yield supabase, user_id
    
    # Clean up
    delete_test_user(user_id)

def test_example(setup):
    """
    Example test
    """
    supabase, user_id = setup
    
    # Test code here
    assert True, "Test failed"
```
