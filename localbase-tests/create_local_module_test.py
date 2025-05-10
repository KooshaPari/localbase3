#!/usr/bin/env python3
"""
Script to create a test file that imports a local module
"""

import os

def main():
    """
    Main function
    """
    # Create a local module
    module_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'local_module')
    os.makedirs(module_dir, exist_ok=True)
    
    # Create __init__.py
    init_file = os.path.join(module_dir, '__init__.py')
    with open(init_file, 'w') as f:
        f.write("""\"\"\"
Local module
\"\"\"
""")
    
    # Create utils.py
    utils_file = os.path.join(module_dir, 'utils.py')
    with open(utils_file, 'w') as f:
        f.write("""\"\"\"
Utils module
\"\"\"

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
""")
    
    # Create a test file that imports the local module
    test_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_local_module.py')
    
    print(f"Creating local module test file at {test_file}...")
    
    with open(test_file, 'w') as f:
        f.write("""#!/usr/bin/env python3
\"\"\"
Test file that imports a local module
\"\"\"

import os
import sys
import pytest

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from local_module.utils import load_config

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

if __name__ == "__main__":
    pytest.main([__file__])
""")
    
    print(f"Created local module test file at {test_file}")

if __name__ == "__main__":
    main()
