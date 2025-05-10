#!/usr/bin/env python3
"""
Test script to check if imports are working
"""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
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
    print("All imports successful!")
    
    # Test loading config
    config = load_config()
    print("Config loaded successfully!")
    print(f"Config keys: {list(config.keys())}")
    
    # Test getting Supabase client
    supabase = get_supabase_client()
    print("Supabase client created successfully!")
    
    # Test getting Supabase admin client
    admin_client = get_supabase_admin_client()
    print("Supabase admin client created successfully!")
    
    # Test getting frontend client
    frontend, frontend_url = get_frontend_client()
    print(f"Frontend client created successfully! URL: {frontend_url}")
    
    # Test getting blockchain client
    blockchain_client, wallet = get_blockchain_client()
    print("Blockchain client created successfully!")
    
    print("All tests passed!")
    
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
