#!/usr/bin/env python3
"""
Test runner for LocalBase integration and security tests
"""

import os
import sys
import argparse
import subprocess
import logging
from typing import List, Optional

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

def parse_args():
    """
    Parse command line arguments
    
    Returns:
        Parsed arguments
    """
    parser = argparse.ArgumentParser(description="LocalBase Test Runner")
    
    parser.add_argument(
        "--config",
        type=str,
        default="config.json",
        help="Path to test configuration file",
    )
    
    parser.add_argument(
        "--test-type",
        type=str,
        choices=["integration", "security", "all"],
        default="all",
        help="Type of tests to run",
    )
    
    parser.add_argument(
        "--test-module",
        type=str,
        help="Specific test module to run",
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output",
    )
    
    return parser.parse_args()

def run_tests(test_type: str, test_module: Optional[str] = None, config_path: str = "config.json", verbose: bool = False) -> bool:
    """
    Run tests
    
    Args:
        test_type: Type of tests to run
        test_module: Specific test module to run
        config_path: Path to test configuration file
        verbose: Enable verbose output
        
    Returns:
        Success flag
    """
    # Set environment variables
    os.environ["LOCALBASE_TEST_CONFIG"] = os.path.abspath(config_path)
    
    # Build command
    cmd = ["pytest"]
    
    if verbose:
        cmd.append("-v")
    
    # Add test path
    if test_type == "all":
        if test_module:
            cmd.append(test_module)
        else:
            cmd.append("integration")
            cmd.append("security")
    else:
        if test_module:
            cmd.append(os.path.join(test_type, test_module))
        else:
            cmd.append(test_type)
    
    # Run tests
    logger.info(f"Running tests: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=False)
        
        return result.returncode == 0
        
    except Exception as e:
        logger.error(f"Error running tests: {e}")
        return False

def main():
    """
    Main entry point
    """
    # Parse arguments
    args = parse_args()
    
    # Run tests
    success = run_tests(
        test_type=args.test_type,
        test_module=args.test_module,
        config_path=args.config,
        verbose=args.verbose,
    )
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
