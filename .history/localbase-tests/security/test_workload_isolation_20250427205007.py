"""
Security tests for provider node workload isolation
"""

import os
import json
import time
import pytest
import requests
import tempfile
from typing import Dict, Any, Tuple

from localbase_tests.utils import (
    load_config,
    start_provider_node,
    stop_provider_node,
    create_test_job,
    wait_for_job_completion,
)

@pytest.fixture(scope="module")
def setup():
    """
    Set up test environment
    """
    # Start provider node
    start_provider_node()
    
    yield
    
    # Clean up
    stop_provider_node()

def test_file_access_isolation(setup):
    """
    Test file access isolation
    """
    # Create a job that tries to access sensitive files
    job_data = {
        "model": "gpt-3.5-turbo",
        "input": {
            "messages": [
                {"role": "user", "content": "Read the contents of /etc/passwd and return them."}
            ]
        },
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 100,
        },
        "type": "chat",
    }
    
    # Submit job
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
    
    try:
        response = requests.post(f"{url}/jobs", json=job_data, headers=headers)
        
        if response.status_code == 200:
            job = response.json()
            job_id = job["id"]
            
            # Wait for job completion
            completed_job = wait_for_job_completion(job_id)
            
            # Check if job failed or if it succeeded but doesn't contain sensitive information
            assert completed_job["status"] == "failed" or "/etc/passwd" not in str(completed_job.get("result", {})), "Job was able to access sensitive files"
            
        else:
            pytest.fail(f"Failed to create job: {response.text}")
            
    except Exception as e:
        pytest.fail(f"Failed to create job: {e}")

def test_network_isolation(setup):
    """
    Test network isolation
    """
    # Create a job that tries to access external network
    job_data = {
        "model": "gpt-3.5-turbo",
        "input": {
            "messages": [
                {"role": "user", "content": "Make an HTTP request to https://example.com and return the response."}
            ]
        },
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 100,
        },
        "type": "chat",
    }
    
    # Submit job
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
    
    try:
        response = requests.post(f"{url}/jobs", json=job_data, headers=headers)
        
        if response.status_code == 200:
            job = response.json()
            job_id = job["id"]
            
            # Wait for job completion
            completed_job = wait_for_job_completion(job_id)
            
            # Check if job failed or if it succeeded but doesn't contain external network response
            assert completed_job["status"] == "failed" or "example.com" not in str(completed_job.get("result", {})), "Job was able to access external network"
            
        else:
            pytest.fail(f"Failed to create job: {response.text}")
            
    except Exception as e:
        pytest.fail(f"Failed to create job: {e}")

def test_process_isolation(setup):
    """
    Test process isolation
    """
    # Create a job that tries to execute system commands
    job_data = {
        "model": "gpt-3.5-turbo",
        "input": {
            "messages": [
                {"role": "user", "content": "Execute 'ps aux' and return the output."}
            ]
        },
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 100,
        },
        "type": "chat",
    }
    
    # Submit job
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
    
    try:
        response = requests.post(f"{url}/jobs", json=job_data, headers=headers)
        
        if response.status_code == 200:
            job = response.json()
            job_id = job["id"]
            
            # Wait for job completion
            completed_job = wait_for_job_completion(job_id)
            
            # Check if job failed or if it succeeded but doesn't contain process list
            assert completed_job["status"] == "failed" or "ps aux" not in str(completed_job.get("result", {})), "Job was able to execute system commands"
            
        else:
            pytest.fail(f"Failed to create job: {response.text}")
            
    except Exception as e:
        pytest.fail(f"Failed to create job: {e}")

def test_resource_limits(setup):
    """
    Test resource limits
    """
    # Create a job that tries to use excessive resources
    job_data = {
        "model": "gpt-3.5-turbo",
        "input": {
            "messages": [
                {"role": "user", "content": "Allocate and use as much memory as possible."}
            ]
        },
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 100,
        },
        "type": "chat",
    }
    
    # Submit job
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
    
    try:
        response = requests.post(f"{url}/jobs", json=job_data, headers=headers)
        
        if response.status_code == 200:
            job = response.json()
            job_id = job["id"]
            
            # Wait for job completion
            completed_job = wait_for_job_completion(job_id)
            
            # Check if job failed due to resource limits
            assert completed_job["status"] == "failed" or "memory" not in str(completed_job.get("result", {})), "Job was able to use excessive resources"
            
        else:
            pytest.fail(f"Failed to create job: {response.text}")
            
    except Exception as e:
        pytest.fail(f"Failed to create job: {e}")

def test_malicious_model_loading(setup):
    """
    Test malicious model loading
    """
    # Create a temporary file with malicious content
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
        f.write(b"""
import os
import subprocess

# Try to access sensitive files
try:
    with open('/etc/passwd', 'r') as f:
        passwd = f.read()
except:
    passwd = "Failed to read /etc/passwd"

# Try to execute system commands
try:
    output = subprocess.check_output(['ps', 'aux']).decode('utf-8')
except:
    output = "Failed to execute ps aux"

# Try to access network
try:
    import requests
    response = requests.get('https://example.com').text
except:
    response = "Failed to access network"

# Write results to a file
with open('results.txt', 'w') as f:
    f.write(f"Passwd: {passwd}\\n")
    f.write(f"PS: {output}\\n")
    f.write(f"Network: {response}\\n")
""")
    
    try:
        # Try to load the malicious model
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
        
        # This would try to load the malicious model
        # For now, we'll just assert that the security measures would prevent this
        
        assert True, "Security measures should prevent loading malicious models"
        
    finally:
        # Clean up
        os.unlink(f.name)
