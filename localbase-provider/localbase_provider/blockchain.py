"""
Blockchain Client for LocalBase Provider Node
"""

import os
import json
import logging
import time
from typing import Dict, Any, List, Optional

from cosmpy.aerial.client import LedgerClient, NetworkConfig
from cosmpy.aerial.wallet import LocalWallet
from cosmpy.aerial.tx import Transaction
from cosmpy.aerial.contract import LedgerContract
from bip32 import BIP32
from mnemonic import Mnemonic

logger = logging.getLogger(__name__)

class BlockchainClient:
    """
    Client for interacting with the LocalBase blockchain
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the blockchain client
        
        Args:
            config: Blockchain configuration
        """
        self.config = config
        self.node_url = config.get("node_url", "http://localhost:26657")
        self.chain_id = config.get("chain_id", "localbase-1")
        self.wallet_mnemonic = config.get("wallet_mnemonic", "")
        self.gas_price = config.get("gas_price", "0.025ulb")
        self.gas_adjustment = config.get("gas_adjustment", 1.5)
        
        self.client = None
        self.wallet = None
        self.provider_registry_contract = None
        self.job_manager_contract = None
        
        self.provider_id = None
        
        logger.info("Blockchain Client initialized")
    
    def initialize(self):
        """
        Initialize the blockchain client
        """
        try:
            # Set up network config
            cfg = NetworkConfig(
                chain_id=self.chain_id,
                url=self.node_url,
                fee_minimum_gas_price=self.gas_price,
                fee_denomination="ulb",
                staking_denomination="ulb",
            )
            
            # Create client
            self.client = LedgerClient(cfg)
            
            # Set up wallet
            self._setup_wallet()
            
            # Load contract addresses
            self._load_contract_addresses()
            
            # Check if provider is registered
            self.provider_id = self._get_provider_id()
            
            logger.info(f"Blockchain client initialized for chain {self.chain_id}")
            logger.info(f"Wallet address: {self.wallet.address()}")
            
        except Exception as e:
            logger.error(f"Failed to initialize blockchain client: {e}")
            raise
    
    def _setup_wallet(self):
        """
        Set up wallet from mnemonic
        """
        if not self.wallet_mnemonic:
            logger.warning("No wallet mnemonic provided, generating new wallet")
            mnemo = Mnemonic("english")
            self.wallet_mnemonic = mnemo.generate(strength=256)
            logger.info(f"Generated new mnemonic: {self.wallet_mnemonic}")
        
        try:
            self.wallet = LocalWallet.from_mnemonic(self.wallet_mnemonic)
            logger.info(f"Wallet set up with address: {self.wallet.address()}")
        except Exception as e:
            logger.error(f"Failed to set up wallet: {e}")
            raise
    
    def _load_contract_addresses(self):
        """
        Load contract addresses from file or environment
        """
        # Try to load from file
        contract_file = "contracts.json"
        if os.path.exists(contract_file):
            try:
                with open(contract_file, 'r') as f:
                    contracts = json.load(f)
                
                provider_registry_address = contracts.get("provider_registry")
                job_manager_address = contracts.get("job_manager")
                
                if provider_registry_address:
                    self.provider_registry_contract = LedgerContract(
                        self.client,
                        provider_registry_address,
                        self.wallet
                    )
                    logger.info(f"Loaded provider registry contract at {provider_registry_address}")
                
                if job_manager_address:
                    self.job_manager_contract = LedgerContract(
                        self.client,
                        job_manager_address,
                        self.wallet
                    )
                    logger.info(f"Loaded job manager contract at {job_manager_address}")
                
            except Exception as e:
                logger.error(f"Failed to load contracts from file: {e}")
        
        # If not loaded from file, try environment variables
        if not self.provider_registry_contract:
            provider_registry_address = os.environ.get("PROVIDER_REGISTRY_CONTRACT")
            if provider_registry_address:
                self.provider_registry_contract = LedgerContract(
                    self.client,
                    provider_registry_address,
                    self.wallet
                )
                logger.info(f"Loaded provider registry contract from env: {provider_registry_address}")
        
        if not self.job_manager_contract:
            job_manager_address = os.environ.get("JOB_MANAGER_CONTRACT")
            if job_manager_address:
                self.job_manager_contract = LedgerContract(
                    self.client,
                    job_manager_address,
                    self.wallet
                )
                logger.info(f"Loaded job manager contract from env: {job_manager_address}")
        
        # If still not loaded, log warning
        if not self.provider_registry_contract:
            logger.warning("Provider registry contract address not found")
        
        if not self.job_manager_contract:
            logger.warning("Job manager contract address not found")
    
    def _get_provider_id(self) -> Optional[str]:
        """
        Get provider ID if already registered
        
        Returns:
            Provider ID or None if not registered
        """
        if not self.provider_registry_contract:
            logger.warning("Provider registry contract not available")
            return None
        
        try:
            # Query all providers
            result = self.provider_registry_contract.query({
                "list_providers": {}
            })
            
            # Check if any provider has the same owner as our wallet
            for provider_id, provider in result:
                if provider["owner"] == self.wallet.address():
                    logger.info(f"Found registered provider with ID: {provider_id}")
                    return provider_id
            
            logger.info("No registered provider found for this wallet")
            return None
            
        except Exception as e:
            logger.error(f"Failed to query provider ID: {e}")
            return None
    
    def get_provider_id(self) -> Optional[str]:
        """
        Get provider ID
        
        Returns:
            Provider ID or None if not registered
        """
        return self.provider_id
    
    def register_provider(
        self,
        name: str,
        hardware_info: Dict[str, Any],
        benchmark_results: Dict[str, Any],
        models_supported: List[str],
        pricing: Dict[str, Dict[str, float]],
        region: str
    ) -> str:
        """
        Register provider on blockchain
        
        Args:
            name: Provider name
            hardware_info: Hardware information
            benchmark_results: Benchmark results
            models_supported: List of supported model IDs
            pricing: Pricing information for each model
            region: Geographic region
            
        Returns:
            Provider ID
        """
        if not self.provider_registry_contract:
            raise ValueError("Provider registry contract not available")
        
        # Format hardware info
        hw_info = {
            "gpu_type": hardware_info.get("gpu_type", "None"),
            "vram": hardware_info.get("vram", "0GB"),
            "cpu_cores": hardware_info.get("cpu_cores", 0),
            "ram": hardware_info.get("ram", "0GB")
        }
        
        # Format benchmark results
        bench_results = {
            "inference_speed": benchmark_results.get("inference_speed", 0),
            "max_batch_size": benchmark_results.get("max_batch_size", 0)
        }
        
        # Format pricing
        pricing_list = []
        for model_id, price_info in pricing.items():
            pricing_list.append({
                "model": model_id,
                "input_price_per_token": str(price_info.get("input_price_per_token", 0)),
                "output_price_per_token": str(price_info.get("output_price_per_token", 0))
            })
        
        try:
            # Execute contract
            tx = self.provider_registry_contract.execute({
                "register_provider": {
                    "name": name,
                    "hardware_info": hw_info,
                    "benchmark_results": bench_results,
                    "models_supported": models_supported,
                    "pricing": pricing_list,
                    "region": region
                }
            })
            
            # Wait for transaction to be included in a block
            tx.wait_to_complete()
            
            # Extract provider ID from transaction events
            provider_id = None
            for event in tx.events:
                if event.type == "wasm":
                    for attr in event.attributes:
                        if attr.key == "provider_id":
                            provider_id = attr.value
                            break
            
            if not provider_id:
                raise ValueError("Provider ID not found in transaction events")
            
            # Save provider ID
            self.provider_id = provider_id
            
            logger.info(f"Provider registered successfully with ID: {provider_id}")
            return provider_id
            
        except Exception as e:
            logger.error(f"Failed to register provider: {e}")
            raise
    
    def update_provider(
        self,
        provider_id: str,
        name: Optional[str] = None,
        hardware_info: Optional[Dict[str, Any]] = None,
        benchmark_results: Optional[Dict[str, Any]] = None,
        models_supported: Optional[List[str]] = None,
        pricing: Optional[Dict[str, Dict[str, float]]] = None,
        status: Optional[str] = None,
        region: Optional[str] = None
    ) -> bool:
        """
        Update provider information
        
        Args:
            provider_id: Provider ID
            name: Provider name
            hardware_info: Hardware information
            benchmark_results: Benchmark results
            models_supported: List of supported model IDs
            pricing: Pricing information for each model
            status: Provider status
            region: Geographic region
            
        Returns:
            Success flag
        """
        if not self.provider_registry_contract:
            raise ValueError("Provider registry contract not available")
        
        # Prepare update data
        update_data = {
            "provider_id": provider_id
        }
        
        if name:
            update_data["name"] = name
        
        if hardware_info:
            update_data["hardware_info"] = {
                "gpu_type": hardware_info.get("gpu_type", "None"),
                "vram": hardware_info.get("vram", "0GB"),
                "cpu_cores": hardware_info.get("cpu_cores", 0),
                "ram": hardware_info.get("ram", "0GB")
            }
        
        if benchmark_results:
            update_data["benchmark_results"] = {
                "inference_speed": benchmark_results.get("inference_speed", 0),
                "max_batch_size": benchmark_results.get("max_batch_size", 0)
            }
        
        if models_supported:
            update_data["models_supported"] = models_supported
        
        if pricing:
            pricing_list = []
            for model_id, price_info in pricing.items():
                pricing_list.append({
                    "model": model_id,
                    "input_price_per_token": str(price_info.get("input_price_per_token", 0)),
                    "output_price_per_token": str(price_info.get("output_price_per_token", 0))
                })
            update_data["pricing"] = pricing_list
        
        if status:
            update_data["status"] = status
        
        if region:
            update_data["region"] = region
        
        try:
            # Execute contract
            tx = self.provider_registry_contract.execute({
                "update_provider": update_data
            })
            
            # Wait for transaction to be included in a block
            tx.wait_to_complete()
            
            logger.info(f"Provider {provider_id} updated successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update provider: {e}")
            return False
    
    def set_provider_status(self, provider_id: str, status: str) -> bool:
        """
        Set provider status
        
        Args:
            provider_id: Provider ID
            status: New status (active, inactive, pending)
            
        Returns:
            Success flag
        """
        if not self.provider_registry_contract:
            raise ValueError("Provider registry contract not available")
        
        try:
            # Execute contract
            tx = self.provider_registry_contract.execute({
                "set_provider_status": {
                    "provider_id": provider_id,
                    "status": status
                }
            })
            
            # Wait for transaction to be included in a block
            tx.wait_to_complete()
            
            logger.info(f"Provider {provider_id} status set to {status}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to set provider status: {e}")
            return False
    
    def get_pending_jobs(self, provider_id: str) -> List[Dict[str, Any]]:
        """
        Get pending jobs for provider
        
        Args:
            provider_id: Provider ID
            
        Returns:
            List of pending jobs
        """
        if not self.job_manager_contract:
            logger.warning("Job manager contract not available")
            return []
        
        try:
            # Query pending jobs
            result = self.job_manager_contract.query({
                "list_jobs_by_provider": {
                    "provider_id": provider_id,
                    "status": "pending"
                }
            })
            
            jobs = []
            for job_id, job in result:
                jobs.append({
                    "id": job_id,
                    "creator": job["creator"],
                    "model": job["model"],
                    "input": job["input"],
                    "parameters": job["parameters"],
                    "created_at": job["created_at"]
                })
            
            return jobs
            
        except Exception as e:
            logger.error(f"Failed to get pending jobs: {e}")
            return []
    
    def start_job(self, job_id: str) -> bool:
        """
        Start a job
        
        Args:
            job_id: Job ID
            
        Returns:
            Success flag
        """
        if not self.job_manager_contract:
            raise ValueError("Job manager contract not available")
        
        try:
            # Execute contract
            tx = self.job_manager_contract.execute({
                "start_job": {
                    "job_id": job_id
                }
            })
            
            # Wait for transaction to be included in a block
            tx.wait_to_complete()
            
            logger.info(f"Job {job_id} started")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start job: {e}")
            return False
    
    def complete_job(self, job_id: str, result: str, usage: Dict[str, int]) -> bool:
        """
        Complete a job
        
        Args:
            job_id: Job ID
            result: Job result
            usage: Token usage information
            
        Returns:
            Success flag
        """
        if not self.job_manager_contract:
            raise ValueError("Job manager contract not available")
        
        try:
            # Execute contract
            tx = self.job_manager_contract.execute({
                "complete_job": {
                    "job_id": job_id,
                    "result": result,
                    "usage": {
                        "input_tokens": usage.get("input_tokens", 0),
                        "output_tokens": usage.get("output_tokens", 0),
                        "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0)
                    }
                }
            })
            
            # Wait for transaction to be included in a block
            tx.wait_to_complete()
            
            logger.info(f"Job {job_id} completed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to complete job: {e}")
            return False
    
    def fail_job(self, job_id: str, error: str) -> bool:
        """
        Fail a job
        
        Args:
            job_id: Job ID
            error: Error message
            
        Returns:
            Success flag
        """
        if not self.job_manager_contract:
            raise ValueError("Job manager contract not available")
        
        try:
            # Execute contract
            tx = self.job_manager_contract.execute({
                "fail_job": {
                    "job_id": job_id,
                    "error": error
                }
            })
            
            # Wait for transaction to be included in a block
            tx.wait_to_complete()
            
            logger.info(f"Job {job_id} failed: {error}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to fail job: {e}")
            return False
    
    def shutdown(self):
        """
        Shutdown the blockchain client
        """
        logger.info("Shutting down blockchain client")
        # Nothing to do here for now
