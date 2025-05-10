"""
LocalBase Provider Node - Main Entry Point
"""

import os
import sys
import time
import signal
import logging
import yaml
from typing import Dict, Any

from localbase_provider.hardware import HardwareManager
from localbase_provider.container import ContainerManager
from localbase_provider.blockchain import BlockchainClient
from localbase_provider.model import ModelRegistry
from localbase_provider.job import JobManager
from localbase_provider.api import start_api_server

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('provider.log')
    ]
)

logger = logging.getLogger(__name__)

class LocalBaseProvider:
    """
    Main provider node class that coordinates all components
    """
    
    def __init__(self, config_path: str = "config.yaml"):
        """
        Initialize the provider node
        
        Args:
            config_path: Path to the configuration file
        """
        self.running = False
        self.config = self._load_config(config_path)
        
        # Initialize components
        self.hardware_manager = HardwareManager(self.config["hardware"])
        self.container_manager = ContainerManager(self.config["security"])
        self.blockchain_client = BlockchainClient(self.config["blockchain"])
        self.model_registry = ModelRegistry(self.config["models"])
        self.job_manager = JobManager(
            self.config["job"],
            self.blockchain_client,
            self.container_manager,
            self.model_registry
        )
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)
        
        logger.info("LocalBase Provider Node initialized")
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load configuration from YAML file
        
        Args:
            config_path: Path to the configuration file
            
        Returns:
            Configuration dictionary
        """
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            
            logger.info(f"Configuration loaded from {config_path}")
            return config
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            sys.exit(1)
    
    def start(self):
        """
        Start the provider node
        """
        logger.info("Starting LocalBase Provider Node")
        self.running = True
        
        try:
            # Initialize hardware
            self.hardware_manager.initialize()
            hardware_info = self.hardware_manager.get_hardware_info()
            logger.info(f"Hardware detected: {hardware_info}")
            
            # Initialize container manager
            self.container_manager.initialize()
            
            # Initialize blockchain client
            self.blockchain_client.initialize()
            
            # Initialize model registry
            self.model_registry.initialize()
            
            # Run benchmarks if needed
            if not os.path.exists("benchmark_results.json"):
                logger.info("Running benchmarks...")
                benchmark_results = self._run_benchmarks()
                logger.info(f"Benchmark results: {benchmark_results}")
            else:
                logger.info("Loading benchmark results from file")
                with open("benchmark_results.json", 'r') as f:
                    benchmark_results = json.load(f)
            
            # Register provider on blockchain if not already registered
            provider_id = self.blockchain_client.get_provider_id()
            if not provider_id:
                logger.info("Registering provider on blockchain")
                provider_id = self._register_provider(hardware_info, benchmark_results)
                logger.info(f"Provider registered with ID: {provider_id}")
            else:
                logger.info(f"Provider already registered with ID: {provider_id}")
            
            # Start API server
            api_thread = threading.Thread(
                target=start_api_server,
                args=(self.config["api"], self.job_manager),
                daemon=True
            )
            api_thread.start()
            
            # Start job manager
            self.job_manager.start()
            
            # Main loop
            while self.running:
                time.sleep(1)
                
        except Exception as e:
            logger.error(f"Error in provider node: {e}")
            self.shutdown()
    
    def _run_benchmarks(self) -> Dict[str, Any]:
        """
        Run benchmarks for all supported models
        
        Returns:
            Benchmark results
        """
        from localbase_provider.benchmark import BenchmarkEngine
        
        benchmark_engine = BenchmarkEngine(
            self.hardware_manager,
            self.container_manager,
            self.model_registry
        )
        
        results = benchmark_engine.run_benchmarks()
        
        # Save results to file
        with open("benchmark_results.json", 'w') as f:
            json.dump(results, f)
        
        return results
    
    def _register_provider(self, hardware_info: Dict[str, Any], benchmark_results: Dict[str, Any]) -> str:
        """
        Register provider on blockchain
        
        Args:
            hardware_info: Hardware information
            benchmark_results: Benchmark results
            
        Returns:
            Provider ID
        """
        provider_config = self.config["provider"]
        models_config = self.config["models"]
        
        return self.blockchain_client.register_provider(
            name=provider_config["name"],
            hardware_info=hardware_info,
            benchmark_results=benchmark_results,
            models_supported=[model["id"] for model in models_config],
            pricing={model["id"]: model["pricing"] for model in models_config},
            region=provider_config["region"]
        )
    
    def _handle_shutdown(self, signum, frame):
        """
        Handle shutdown signals
        """
        logger.info(f"Received signal {signum}, shutting down")
        self.shutdown()
    
    def shutdown(self):
        """
        Shutdown the provider node
        """
        logger.info("Shutting down LocalBase Provider Node")
        self.running = False
        
        # Stop job manager
        self.job_manager.stop()
        
        # Stop container manager
        self.container_manager.shutdown()
        
        # Stop blockchain client
        self.blockchain_client.shutdown()
        
        logger.info("LocalBase Provider Node shutdown complete")
        sys.exit(0)

if __name__ == "__main__":
    import threading
    import json
    
    provider = LocalBaseProvider()
    provider.start()
