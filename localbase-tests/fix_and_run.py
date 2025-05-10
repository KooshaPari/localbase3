#!/usr/bin/env python3
"""
Script to fix imports in test files and run the tests
"""

import os
import sys
import glob
import subprocess

def create_init_files():
    """
    Create __init__.py files in all directories
    """
    print("Creating __init__.py files in test directories...")
    
    # Create directories if they don't exist
    os.makedirs("integration/frontend-blockchain", exist_ok=True)
    os.makedirs("integration/frontend-supabase", exist_ok=True)
    os.makedirs("integration/supabase-blockchain", exist_ok=True)
    os.makedirs("security", exist_ok=True)
    
    # Create __init__.py files
    open("integration/__init__.py", "w").close()
    open("integration/frontend-blockchain/__init__.py", "w").close()
    open("integration/frontend-supabase/__init__.py", "w").close()
    open("integration/supabase-blockchain/__init__.py", "w").close()
    open("security/__init__.py", "w").close()
    
    print("__init__.py files created successfully!")

def install_package():
    """
    Install the package in development mode
    """
    print("Installing localbase_tests package in development mode...")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-e", "."])
        print("Package installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error installing package: {e}")
        sys.exit(1)

def test_imports():
    """
    Test if imports are working
    """
    print("Testing imports...")
    
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
        
        print("All import tests passed!")
    except ImportError as e:
        print(f"Import error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def run_tests():
    """
    Run the tests
    """
    print("Running tests...")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pytest", "-v"])
        print("All tests passed!")
    except subprocess.CalledProcessError as e:
        print(f"Some tests failed: {e}")
        sys.exit(1)

def main():
    """
    Main function
    """
    # Create __init__.py files
    create_init_files()
    
    # Install the package
    install_package()
    
    # Test imports
    test_imports()
    
    # Run tests
    run_tests()

if __name__ == "__main__":
    main()
