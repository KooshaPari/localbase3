"""
Integration tests for frontend and blockchain job management
"""

import os
import json
import time
import pytest
import requests
from typing import Dict, Any, Tuple

import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from localbase_tests.utils import (
    load_config,
    get_supabase_client,
    create_test_user,
    delete_test_user,
    start_frontend_server,
    stop_frontend_server,
    start_local_blockchain,
    stop_local_blockchain,
    get_frontend_client,
    get_blockchain_client,
)


@pytest.fixture(scope="module")
def setup():
    """
    Set up test environment
    """
    # Start services
    start_frontend_server()
    start_local_blockchain()

    # Create test user
    supabase, user_id = create_test_user()

    # Get clients
    frontend, frontend_url = get_frontend_client()
    blockchain_client, wallet = get_blockchain_client()

    # Sign in to frontend
    config = load_config()
    supabase_config = config.get("supabase", {})

    email = supabase_config.get("test_user_email")
    password = supabase_config.get("test_user_password")

    frontend.post(
        f"{frontend_url}/api/auth/signin",
        json={
            "email": email,
            "password": password,
        },
    )

    yield supabase, user_id, frontend, frontend_url, blockchain_client, wallet

    # Clean up
    delete_test_user(user_id)
    stop_frontend_server()
    stop_local_blockchain()


def test_create_job(setup):
    """
    Test job creation
    """
    supabase, user_id, frontend, frontend_url, blockchain_client, wallet = setup

    # Create job using frontend API
    job_data = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": "Hello, world!"}],
        "temperature": 0.7,
        "max_tokens": 100,
    }

    response = frontend.post(f"{frontend_url}/api/jobs", json=job_data)

    # Check response
    assert response.status_code == 200, f"Job creation failed: {response.text}"

    job = response.json()

    # Check job ID
    assert "id" in job, "Job ID not returned"

    # Verify job exists in blockchain
    # This would verify the job exists in the blockchain
    # For now, we'll just assert the response is successful


def test_get_job(setup):
    """
    Test job retrieval
    """
    supabase, user_id, frontend, frontend_url, blockchain_client, wallet = setup

    # Create job first
    job_data = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": "Hello, world!"}],
        "temperature": 0.7,
        "max_tokens": 100,
    }

    response = frontend.post(f"{frontend_url}/api/jobs", json=job_data)

    assert response.status_code == 200, f"Job creation failed: {response.text}"

    job = response.json()
    job_id = job["id"]

    # Get job using frontend API
    response = frontend.get(f"{frontend_url}/api/jobs/{job_id}")

    # Check response
    assert response.status_code == 200, f"Job retrieval failed: {response.text}"

    job = response.json()

    # Check job ID
    assert job["id"] == job_id, "Job ID mismatch"


def test_list_jobs(setup):
    """
    Test job listing
    """
    supabase, user_id, frontend, frontend_url, blockchain_client, wallet = setup

    # Create a few jobs
    for i in range(3):
        job_data = {
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": f"Test message {i}"}],
            "temperature": 0.7,
            "max_tokens": 100,
        }

        frontend.post(f"{frontend_url}/api/jobs", json=job_data)

    # List jobs using frontend API
    response = frontend.get(f"{frontend_url}/api/jobs")

    # Check response
    assert response.status_code == 200, f"Job listing failed: {response.text}"

    jobs = response.json()

    # Check jobs
    assert isinstance(jobs, list), "Jobs not returned as a list"
    assert len(jobs) >= 3, "Not all jobs returned"


def test_cancel_job(setup):
    """
    Test job cancellation
    """
    supabase, user_id, frontend, frontend_url, blockchain_client, wallet = setup

    # Create job
    job_data = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "user",
                "content": "This is a long job that will take a while to complete.",
            }
        ],
        "temperature": 0.7,
        "max_tokens": 1000,
    }

    response = frontend.post(f"{frontend_url}/api/jobs", json=job_data)

    assert response.status_code == 200, f"Job creation failed: {response.text}"

    job = response.json()
    job_id = job["id"]

    # Cancel job using frontend API
    response = frontend.post(f"{frontend_url}/api/jobs/{job_id}/cancel")

    # Check response
    assert response.status_code == 200, f"Job cancellation failed: {response.text}"

    # Verify job is cancelled
    response = frontend.get(f"{frontend_url}/api/jobs/{job_id}")

    assert response.status_code == 200, f"Job retrieval failed: {response.text}"

    job = response.json()

    assert job["status"] in [
        "cancelled",
        "failed",
    ], f"Job not cancelled: {job['status']}"
