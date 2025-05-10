"""
Integration tests for frontend and Supabase authentication
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
    get_supabase_admin_client,
    create_test_user,
    delete_test_user,
    start_frontend_server,
    stop_frontend_server,
    get_frontend_client,
)


@pytest.fixture(scope="module")
def setup():
    """
    Set up test environment
    """
    # Start frontend server
    start_frontend_server()

    # Create test user
    supabase, user_id = create_test_user()

    # Get frontend client
    frontend, frontend_url = get_frontend_client()

    yield supabase, user_id, frontend, frontend_url

    # Clean up
    delete_test_user(user_id)
    stop_frontend_server()


def test_signup(setup):
    """
    Test user signup
    """
    supabase, user_id, frontend, frontend_url = setup
    config = load_config()
    supabase_config = config.get("supabase", {})

    # Generate random email
    import random
    import string

    random_str = "".join(random.choices(string.ascii_lowercase + string.digits, k=10))
    email = f"test-{random_str}@example.com"
    password = "password123"

    # Sign up using frontend API
    response = frontend.post(
        f"{frontend_url}/api/auth/signup",
        json={
            "email": email,
            "password": password,
        },
    )

    # Check response
    assert response.status_code == 200, f"Signup failed: {response.text}"

    # Verify user exists in Supabase
    admin_client = get_supabase_admin_client()

    # This would verify the user exists
    # For now, we'll just assert the response is successful

    # Clean up
    # This would delete the test user
    # For now, we'll just pass


def test_signin(setup):
    """
    Test user signin
    """
    supabase, user_id, frontend, frontend_url = setup
    config = load_config()
    supabase_config = config.get("supabase", {})

    email = supabase_config.get("test_user_email")
    password = supabase_config.get("test_user_password")

    # Sign in using frontend API
    response = frontend.post(
        f"{frontend_url}/api/auth/signin",
        json={
            "email": email,
            "password": password,
        },
    )

    # Check response
    assert response.status_code == 200, f"Signin failed: {response.text}"

    # Check if session cookie is set
    assert "next-auth.session-token" in frontend.cookies, "Session cookie not set"


def test_signout(setup):
    """
    Test user signout
    """
    supabase, user_id, frontend, frontend_url = setup
    config = load_config()
    supabase_config = config.get("supabase", {})

    email = supabase_config.get("test_user_email")
    password = supabase_config.get("test_user_password")

    # Sign in first
    response = frontend.post(
        f"{frontend_url}/api/auth/signin",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200, f"Signin failed: {response.text}"

    # Sign out
    response = frontend.post(f"{frontend_url}/api/auth/signout")

    # Check response
    assert response.status_code == 200, f"Signout failed: {response.text}"

    # Check if session cookie is removed
    assert (
        "next-auth.session-token" not in frontend.cookies
    ), "Session cookie not removed"


def test_protected_route(setup):
    """
    Test protected route
    """
    supabase, user_id, frontend, frontend_url = setup
    config = load_config()
    supabase_config = config.get("supabase", {})

    email = supabase_config.get("test_user_email")
    password = supabase_config.get("test_user_password")

    # Try to access protected route without authentication
    response = frontend.get(f"{frontend_url}/api/user/profile")

    # Should redirect to signin
    assert response.status_code in [
        401,
        403,
    ], f"Protected route accessible without authentication: {response.status_code}"

    # Sign in
    response = frontend.post(
        f"{frontend_url}/api/auth/signin",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200, f"Signin failed: {response.text}"

    # Try to access protected route with authentication
    response = frontend.get(f"{frontend_url}/api/user/profile")

    # Should succeed
    assert (
        response.status_code == 200
    ), f"Protected route not accessible with authentication: {response.status_code}"
