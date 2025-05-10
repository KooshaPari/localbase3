"""
Utility functions for LocalBase tests
"""

import os
import json
import time
import subprocess
import requests
from typing import Dict, Any, Tuple, Optional

def load_config() -> Dict[str, Any]:
    """
    Load configuration from config.json
    """
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')
    
    if not os.path.exists(config_path):
        # Create default config if it doesn't exist
        config = {
            "supabase": {
                "url": "http://localhost:54321",
                "anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
                "test_user_email": "test@example.com",
                "test_user_password": "password123"
            },
            "frontend": {
                "url": "http://localhost:3000"
            },
            "blockchain": {
                "url": "http://localhost:26657",
                "chain_id": "localbase",
                "mnemonic": "test test test test test test test test test test test junk"
            },
            "provider": {
                "url": "http://localhost:8000",
                "api_key": "lb_test_key"
            }
        }
        
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
    
    with open(config_path, 'r') as f:
        return json.load(f)

def get_supabase_client():
    """
    Get Supabase client
    """
    # This is a placeholder - in a real implementation, you would use the Supabase Python client
    config = load_config()
    supabase_config = config.get("supabase", {})
    
    # Return a mock client for now
    class SupabaseMockClient:
        def __init__(self, url, key):
            self.url = url
            self.key = key
        
        def auth(self):
            return self
        
        def sign_up(self, email, password):
            return {"user": {"id": "mock-user-id"}}
        
        def sign_in(self, email, password):
            return {"user": {"id": "mock-user-id"}}
    
    return SupabaseMockClient(
        supabase_config.get("url"),
        supabase_config.get("anon_key")
    )

def create_test_user() -> Tuple[Any, str]:
    """
    Create a test user in Supabase
    """
    supabase = get_supabase_client()
    config = load_config()
    supabase_config = config.get("supabase", {})
    
    email = supabase_config.get("test_user_email")
    password = supabase_config.get("test_user_password")
    
    # Create user
    result = supabase.auth().sign_up(email, password)
    
    # Return supabase client and user ID
    return supabase, result["user"]["id"]

def delete_test_user(user_id: str) -> None:
    """
    Delete a test user from Supabase
    """
    # This is a placeholder - in a real implementation, you would delete the user
    pass

def start_frontend_server() -> None:
    """
    Start the frontend server
    """
    # This is a placeholder - in a real implementation, you would start the server
    # For example:
    # subprocess.Popen(["npm", "run", "dev"], cwd="../localbase-frontend")
    pass

def stop_frontend_server() -> None:
    """
    Stop the frontend server
    """
    # This is a placeholder - in a real implementation, you would stop the server
    pass

def start_local_blockchain() -> None:
    """
    Start the local blockchain
    """
    # This is a placeholder - in a real implementation, you would start the blockchain
    pass

def stop_local_blockchain() -> None:
    """
    Stop the local blockchain
    """
    # This is a placeholder - in a real implementation, you would stop the blockchain
    pass

def get_frontend_client() -> Tuple[requests.Session, str]:
    """
    Get a client for the frontend API
    """
    config = load_config()
    frontend_config = config.get("frontend", {})
    url = frontend_config.get("url")
    
    session = requests.Session()
    
    return session, url

def get_blockchain_client() -> Tuple[Any, Any]:
    """
    Get a client for the blockchain
    """
    # This is a placeholder - in a real implementation, you would use a blockchain client
    config = load_config()
    blockchain_config = config.get("blockchain", {})
    
    # Return mock client and wallet
    class BlockchainMockClient:
        def __init__(self, url, chain_id):
            self.url = url
            self.chain_id = chain_id
    
    class MockWallet:
        def __init__(self, mnemonic):
            self.mnemonic = mnemonic
    
    return (
        BlockchainMockClient(
            blockchain_config.get("url"),
            blockchain_config.get("chain_id")
        ),
        MockWallet(blockchain_config.get("mnemonic"))
    )

def start_provider_node() -> None:
    """
    Start the provider node
    """
    # This is a placeholder - in a real implementation, you would start the provider node
    pass

def stop_provider_node() -> None:
    """
    Stop the provider node
    """
    # This is a placeholder - in a real implementation, you would stop the provider node
    pass
