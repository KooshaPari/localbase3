"""
Main entry point for LocalBase Provider Node
"""

import os
import sys
import json
import time
import logging
import argparse
import signal
from typing import Dict, Any

from .provider import ProviderNode
from .job_processor import JobProcessor
from .api_server import APIServer
from .blockchain_client import BlockchainClient
from .security import SecurityManager
from .monitoring import MonitoringSystem
from .autoscaler import AutoScaler

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
    ],
)

logger = logging.getLogger(__name__)

def parse_args():
    """
    Parse command line arguments
    
    Returns:
        Parsed arguments
    """
    parser = argparse.ArgumentParser(description="LocalBase Provider Node")
    
    parser.add_argument(
        "--config",
        type=str,
        default="config.json",
        help="Path to configuration file",
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging",
    )
    
    return parser.parse_args()

def load_config(config_path: str) -> Dict[str, Any]:
    """
    Load configuration from file
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Configuration dictionary
    """
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
        
        return config
        
    except Exception as e:
        logger.error(f"Error loading configuration: {e}")
        return {}

def create_default_config() -> Dict[str, Any]:
    """
    Create default configuration
    
    Returns:
        Default configuration
    """
    return {
        "provider": {
            "node_id": "",
            "provider_name": "LocalBase Provider",
            "provider_description": "LocalBase Provider Node",
            "provider_endpoint": "http://localhost:8000",
            "provider_models": ["gpt-3.5-turbo", "gpt-4"],
        },
        "api_server": {
            "host": "0.0.0.0",
            "port": 8000,
            "debug": False,
            "api_keys": [],
            "enable_cors": True,
            "cors_origins": ["*"],
        },
        "blockchain": {
            "chain_id": "localbase-testnet-1",
            "rpc_endpoint": "http://localhost:26657",
            "rest_endpoint": "http://localhost:1317",
            "mnemonic": "",
            "address": "",
            "provider_contract": "",
            "job_contract": "",
            "model_contract": "",
            "gas_price": "0.001ulb",
            "gas_adjustment": 1.3,
            "sync_interval": 60,
        },
        "job_processor": {
            "job_dir": "/var/lib/localbase/jobs",
            "max_concurrent_jobs": 10,
            "job_timeout": 300,
        },
        "security": {
            "sandbox_dir": "/tmp/localbase/sandbox",
            "enable_seccomp": True,
            "enable_apparmor": True,
            "enable_cgroups": True,
            "enable_network_isolation": True,
            "allowed_hosts": [],
            "max_file_size": 104857600,
            "allowed_file_types": [".py", ".txt", ".json", ".onnx", ".bin", ".safetensors"],
            "scan_models": True,
            "runtime_monitoring": True,
        },
        "monitoring": {
            "metrics_dir": "/var/lib/localbase/metrics",
            "log_dir": "/var/log/localbase",
            "collection_interval": 60,
            "retention_period": 7,
            "alert_cooldown": 300,
            "thresholds": {
                "cpu_usage": 90,
                "memory_usage": 90,
                "disk_usage": 90,
                "gpu_usage": 90,
                "gpu_memory_usage": 90,
                "job_error_rate": 5,
                "job_queue_size": 100,
                "job_processing_time": 300,
            },
        },
        "autoscaler": {
            "scaling_dir": "/var/lib/localbase/scaling",
            "min_workers": 1,
            "max_workers": 10,
            "initial_workers": 1,
            "target_cpu_usage": 70,
            "target_gpu_usage": 80,
            "target_memory_usage": 80,
            "scale_up_threshold": 85,
            "scale_down_threshold": 50,
            "scale_up_factor": 1.5,
            "scale_down_factor": 0.8,
            "cooldown_period": 300,
            "scaling_enabled": True,
        },
        "logging": {
            "level": "INFO",
            "file": "/var/log/localbase/provider.log",
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
    }

def save_config(config: Dict[str, Any], config_path: str) -> bool:
    """
    Save configuration to file
    
    Args:
        config: Configuration dictionary
        config_path: Path to configuration file
        
    Returns:
        Success flag
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(config_path)), exist_ok=True)
        
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)
        
        return True
        
    except Exception as e:
        logger.error(f"Error saving configuration: {e}")
        return False

def main():
    """
    Main entry point
    """
    # Parse arguments
    args = parse_args()
    
    # Set debug logging
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Load configuration
    config = load_config(args.config)
    
    # Create default configuration if not found
    if not config:
        logger.info(f"Configuration not found, creating default: {args.config}")
        config = create_default_config()
        save_config(config, args.config)
    
    # Create provider node
    provider = ProviderNode(args.config)
    
    # Set up signal handlers
    def signal_handler(sig, frame):
        logger.info("Shutting down...")
        provider.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start provider node
    provider.start()
    
    # Keep running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        provider.stop()

if __name__ == "__main__":
    main()
