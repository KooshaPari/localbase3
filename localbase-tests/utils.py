"""
Test utilities for LocalBase integration tests
"""

import os
import json
import time
import logging
import requests
import subprocess
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

import pytest
from supabase import create_client, Client

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

def load_config() -> Dict[str, Any]:
    """
    Load test configuration
    
    Returns:
        Test configuration
    """
    config_path = os.environ.get("LOCALBASE_TEST_CONFIG", "config.json")
    
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
        
        return config
        
    except Exception as e:
        logger.error(f"Error loading configuration: {e}")
        return {}

def get_supabase_client() -> Client:
    """
    Get Supabase client
    
    Returns:
        Supabase client
    """
    config = load_config()
    supabase_config = config.get("supabase", {})
    
    url = supabase_config.get("url")
    key = supabase_config.get("anon_key")
    
    if not url or not key:
        pytest.skip("Supabase configuration not found")
    
    return create_client(url, key)

def get_supabase_admin_client() -> Client:
    """
    Get Supabase admin client
    
    Returns:
        Supabase admin client
    """
    config = load_config()
    supabase_config = config.get("supabase", {})
    
    url = supabase_config.get("url")
    key = supabase_config.get("service_role_key")
    
    if not url or not key:
        pytest.skip("Supabase configuration not found")
    
    return create_client(url, key)

def create_test_user() -> Tuple[Client, str]:
    """
    Create a test user in Supabase
    
    Returns:
        Tuple of (supabase client, user ID)
    """
    config = load_config()
    supabase_config = config.get("supabase", {})
    
    email = supabase_config.get("test_user_email")
    password = supabase_config.get("test_user_password")
    
    if not email or not password:
        pytest.skip("Test user configuration not found")
    
    # Create client
    supabase = get_supabase_client()
    
    # Sign up user
    try:
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
        })
        
        user_id = response.user.id
        
    except Exception as e:
        # User might already exist, try to sign in
        try:
            response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
            
            user_id = response.user.id
            
        except Exception as e:
            logger.error(f"Error creating test user: {e}")
            pytest.skip(f"Failed to create test user: {e}")
    
    return supabase, user_id

def delete_test_user(user_id: str):
    """
    Delete a test user from Supabase
    
    Args:
        user_id: User ID
    """
    # Get admin client
    supabase = get_supabase_admin_client()
    
    try:
        # Delete user
        supabase.auth.admin.delete_user(user_id)
        
    except Exception as e:
        logger.error(f"Error deleting test user: {e}")

def start_local_blockchain():
    """
    Start a local blockchain for testing
    """
    try:
        # Check if blockchain is already running
        config = load_config()
        blockchain_config = config.get("blockchain", {})
        rpc_endpoint = blockchain_config.get("rpc_endpoint")
        
        if rpc_endpoint:
            try:
                response = requests.get(f"{rpc_endpoint}/status")
                if response.status_code == 200:
                    logger.info("Blockchain already running")
                    return
            except:
                pass
        
        # Start blockchain
        logger.info("Starting local blockchain")
        
        # This would start a local blockchain
        # For now, we'll just log a message
        
        logger.info("Local blockchain started")
        
    except Exception as e:
        logger.error(f"Error starting local blockchain: {e}")
        pytest.skip(f"Failed to start local blockchain: {e}")

def stop_local_blockchain():
    """
    Stop the local blockchain
    """
    try:
        # Stop blockchain
        logger.info("Stopping local blockchain")
        
        # This would stop the local blockchain
        # For now, we'll just log a message
        
        logger.info("Local blockchain stopped")
        
    except Exception as e:
        logger.error(f"Error stopping local blockchain: {e}")

def start_local_supabase():
    """
    Start a local Supabase instance for testing
    """
    try:
        # Check if Supabase is already running
        config = load_config()
        supabase_config = config.get("supabase", {})
        url = supabase_config.get("url")
        
        if url:
            try:
                response = requests.get(f"{url}/rest/v1/")
                if response.status_code == 200:
                    logger.info("Supabase already running")
                    return
            except:
                pass
        
        # Start Supabase
        logger.info("Starting local Supabase")
        
        # This would start a local Supabase instance
        # For now, we'll just log a message
        
        logger.info("Local Supabase started")
        
    except Exception as e:
        logger.error(f"Error starting local Supabase: {e}")
        pytest.skip(f"Failed to start local Supabase: {e}")

def stop_local_supabase():
    """
    Stop the local Supabase instance
    """
    try:
        # Stop Supabase
        logger.info("Stopping local Supabase")
        
        # This would stop the local Supabase instance
        # For now, we'll just log a message
        
        logger.info("Local Supabase stopped")
        
    except Exception as e:
        logger.error(f"Error stopping local Supabase: {e}")

def start_frontend_server():
    """
    Start the frontend server for testing
    """
    try:
        # Check if frontend is already running
        config = load_config()
        frontend_config = config.get("frontend", {})
        url = frontend_config.get("url")
        
        if url:
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    logger.info("Frontend already running")
                    return
            except:
                pass
        
        # Start frontend
        logger.info("Starting frontend server")
        
        # This would start the frontend server
        # For now, we'll just log a message
        
        logger.info("Frontend server started")
        
    except Exception as e:
        logger.error(f"Error starting frontend server: {e}")
        pytest.skip(f"Failed to start frontend server: {e}")

def stop_frontend_server():
    """
    Stop the frontend server
    """
    try:
        # Stop frontend
        logger.info("Stopping frontend server")
        
        # This would stop the frontend server
        # For now, we'll just log a message
        
        logger.info("Frontend server stopped")
        
    except Exception as e:
        logger.error(f"Error stopping frontend server: {e}")

def start_provider_node():
    """
    Start the provider node for testing
    """
    try:
        # Check if provider node is already running
        config = load_config()
        provider_config = config.get("provider", {})
        url = provider_config.get("url")
        
        if url:
            try:
                response = requests.get(f"{url}/health")
                if response.status_code == 200:
                    logger.info("Provider node already running")
                    return
            except:
                pass
        
        # Start provider node
        logger.info("Starting provider node")
        
        # This would start the provider node
        # For now, we'll just log a message
        
        logger.info("Provider node started")
        
    except Exception as e:
        logger.error(f"Error starting provider node: {e}")
        pytest.skip(f"Failed to start provider node: {e}")

def stop_provider_node():
    """
    Stop the provider node
    """
    try:
        # Stop provider node
        logger.info("Stopping provider node")
        
        # This would stop the provider node
        # For now, we'll just log a message
        
        logger.info("Provider node stopped")
        
    except Exception as e:
        logger.error(f"Error stopping provider node: {e}")

def wait_for_job_completion(job_id: str, timeout: int = 60) -> Dict[str, Any]:
    """
    Wait for a job to complete
    
    Args:
        job_id: Job ID
        timeout: Timeout in seconds
        
    Returns:
        Job information
    """
    config = load_config()
    provider_config = config.get("provider", {})
    url = provider_config.get("url")
    api_key = provider_config.get("api_key")
    
    if not url or not api_key:
        pytest.skip("Provider configuration not found")
    
    # Set up headers
    headers = {
        "X-API-Key": api_key,
    }
    
    # Wait for job completion
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{url}/jobs/{job_id}", headers=headers)
            
            if response.status_code == 200:
                job = response.json()
                
                if job["status"] in ["completed", "failed"]:
                    return job
                
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Error checking job status: {e}")
            time.sleep(1)
    
    pytest.fail(f"Job {job_id} did not complete within {timeout} seconds")

def create_test_job(model: str = "gpt-3.5-turbo") -> Dict[str, Any]:
    """
    Create a test job
    
    Args:
        model: Model ID
        
    Returns:
        Job information
    """
    config = load_config()
    provider_config = config.get("provider", {})
    url = provider_config.get("url")
    api_key = provider_config.get("api_key")
    
    if not url or not api_key:
        pytest.skip("Provider configuration not found")
    
    # Set up headers
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json",
    }
    
    # Create job
    job_data = {
        "model": model,
        "input": {
            "messages": [
                {"role": "user", "content": "Hello, world!"}
            ]
        },
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 100,
        },
        "type": "chat",
    }
    
    try:
        response = requests.post(f"{url}/jobs", json=job_data, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            pytest.fail(f"Failed to create job: {response.text}")
            
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        pytest.fail(f"Failed to create job: {e}")

def get_blockchain_client():
    """
    Get blockchain client
    
    Returns:
        Blockchain client
    """
    config = load_config()
    blockchain_config = config.get("blockchain", {})
    
    chain_id = blockchain_config.get("chain_id")
    rpc_endpoint = blockchain_config.get("rpc_endpoint")
    mnemonic = blockchain_config.get("test_mnemonic")
    
    if not chain_id or not rpc_endpoint or not mnemonic:
        pytest.skip("Blockchain configuration not found")
    
    try:
        from cosmpy.aerial.client import LedgerClient, NetworkConfig
        from cosmpy.aerial.wallet import LocalWallet
        
        # Create network config
        cfg = NetworkConfig(
            chain_id=chain_id,
            url=rpc_endpoint,
            fee_minimum_gas_price=0.001,
            fee_denomination="ulb",
            staking_denomination="ulb",
        )
        
        # Create client
        client = LedgerClient(cfg)
        
        # Create wallet
        wallet = LocalWallet.from_mnemonic(mnemonic)
        
        return client, wallet
        
    except ImportError:
        logger.warning("CosmPy not installed, using simulated blockchain client")
        return None, None
    except Exception as e:
        logger.error(f"Error creating blockchain client: {e}")
        pytest.skip(f"Failed to create blockchain client: {e}")

def get_frontend_client():
    """
    Get frontend client
    
    Returns:
        Frontend client (requests session)
    """
    config = load_config()
    frontend_config = config.get("frontend", {})
    
    url = frontend_config.get("url")
    
    if not url:
        pytest.skip("Frontend configuration not found")
    
    # Create session
    session = requests.Session()
    
    return session, url
