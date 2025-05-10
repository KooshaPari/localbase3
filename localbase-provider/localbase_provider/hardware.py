"""
Hardware Manager for LocalBase Provider Node
"""

import os
import sys
import logging
import platform
import psutil
import cpuinfo
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Try to import GPU-specific libraries
try:
    import GPUtil
    import torch
    HAS_GPU = True
except ImportError:
    logger.warning("GPU libraries not available, running in CPU-only mode")
    HAS_GPU = False

try:
    import pynvml
    pynvml.nvmlInit()
    HAS_NVML = True
except ImportError:
    logger.warning("NVIDIA Management Library not available")
    HAS_NVML = False
except Exception as e:
    logger.warning(f"Failed to initialize NVIDIA Management Library: {e}")
    HAS_NVML = False

class HardwareManager:
    """
    Manages hardware resources for the provider node
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the hardware manager
        
        Args:
            config: Hardware configuration
        """
        self.config = config
        self.gpu_memory_reserve = config.get("gpu_memory_reserve", 1024)  # MB
        self.cpu_cores_reserve = config.get("cpu_cores_reserve", 2)
        
        self.gpus = []
        self.cpu_info = {}
        self.memory_info = {}
        self.system_info = {}
        
        logger.info("Hardware Manager initialized")
    
    def initialize(self):
        """
        Initialize hardware detection
        """
        logger.info("Detecting hardware...")
        
        # Detect system info
        self.system_info = {
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "hostname": platform.node()
        }
        
        # Detect CPU info
        self._detect_cpu()
        
        # Detect memory info
        self._detect_memory()
        
        # Detect GPUs
        self._detect_gpus()
        
        logger.info("Hardware detection complete")
    
    def _detect_cpu(self):
        """
        Detect CPU information
        """
        try:
            cpu_info_raw = cpuinfo.get_cpu_info()
            self.cpu_info = {
                "brand": cpu_info_raw.get("brand_raw", "Unknown"),
                "architecture": cpu_info_raw.get("arch", "Unknown"),
                "cores_physical": psutil.cpu_count(logical=False),
                "cores_logical": psutil.cpu_count(logical=True),
                "frequency": cpu_info_raw.get("hz_actual", (0, ""))[0] / 1000000000,  # GHz
                "available_cores": max(1, psutil.cpu_count(logical=True) - self.cpu_cores_reserve)
            }
            logger.info(f"CPU detected: {self.cpu_info['brand']} with {self.cpu_info['cores_logical']} logical cores")
        except Exception as e:
            logger.error(f"Failed to detect CPU: {e}")
            self.cpu_info = {
                "brand": "Unknown",
                "architecture": "Unknown",
                "cores_physical": 1,
                "cores_logical": 1,
                "frequency": 0,
                "available_cores": 1
            }
    
    def _detect_memory(self):
        """
        Detect memory information
        """
        try:
            mem = psutil.virtual_memory()
            self.memory_info = {
                "total": mem.total,
                "total_gb": mem.total / (1024 ** 3),
                "available": mem.available,
                "available_gb": mem.available / (1024 ** 3),
                "percent_used": mem.percent
            }
            logger.info(f"Memory detected: {self.memory_info['total_gb']:.2f} GB total, {self.memory_info['available_gb']:.2f} GB available")
        except Exception as e:
            logger.error(f"Failed to detect memory: {e}")
            self.memory_info = {
                "total": 0,
                "total_gb": 0,
                "available": 0,
                "available_gb": 0,
                "percent_used": 0
            }
    
    def _detect_gpus(self):
        """
        Detect GPU information
        """
        self.gpus = []
        
        if not HAS_GPU:
            logger.warning("No GPU support available")
            return
        
        try:
            # Check if CUDA is available
            if not torch.cuda.is_available():
                logger.warning("CUDA is not available")
                return
            
            # Get GPU count from PyTorch
            gpu_count = torch.cuda.device_count()
            if gpu_count == 0:
                logger.warning("No GPUs detected by PyTorch")
                return
            
            logger.info(f"Detected {gpu_count} GPUs with CUDA support")
            
            # Get detailed GPU info
            if HAS_NVML:
                self._detect_gpus_nvml()
            else:
                self._detect_gpus_gputil()
                
        except Exception as e:
            logger.error(f"Failed to detect GPUs: {e}")
    
    def _detect_gpus_nvml(self):
        """
        Detect GPUs using NVIDIA Management Library
        """
        try:
            device_count = pynvml.nvmlDeviceGetCount()
            
            for i in range(device_count):
                handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                
                # Get device info
                name = pynvml.nvmlDeviceGetName(handle)
                memory_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                compute_capability = pynvml.nvmlDeviceGetCudaComputeCapability(handle)
                
                # Calculate available memory
                total_memory_mb = memory_info.total / (1024 * 1024)
                available_memory_mb = max(0, total_memory_mb - self.gpu_memory_reserve)
                
                gpu_info = {
                    "index": i,
                    "name": name,
                    "compute_capability": f"{compute_capability[0]}.{compute_capability[1]}",
                    "total_memory": memory_info.total,
                    "total_memory_mb": total_memory_mb,
                    "available_memory_mb": available_memory_mb,
                    "utilization": pynvml.nvmlDeviceGetUtilizationRates(handle).gpu
                }
                
                self.gpus.append(gpu_info)
                logger.info(f"GPU {i}: {name} with {total_memory_mb:.0f} MB memory")
                
        except Exception as e:
            logger.error(f"Failed to detect GPUs using NVML: {e}")
    
    def _detect_gpus_gputil(self):
        """
        Detect GPUs using GPUtil
        """
        try:
            gpu_list = GPUtil.getGPUs()
            
            for i, gpu in enumerate(gpu_list):
                # Calculate available memory
                total_memory_mb = gpu.memoryTotal
                available_memory_mb = max(0, total_memory_mb - self.gpu_memory_reserve)
                
                gpu_info = {
                    "index": i,
                    "name": gpu.name,
                    "compute_capability": "Unknown",
                    "total_memory": gpu.memoryTotal * 1024 * 1024,  # Convert to bytes
                    "total_memory_mb": gpu.memoryTotal,
                    "available_memory_mb": available_memory_mb,
                    "utilization": gpu.load * 100  # Convert to percentage
                }
                
                self.gpus.append(gpu_info)
                logger.info(f"GPU {i}: {gpu.name} with {gpu.memoryTotal:.0f} MB memory")
                
        except Exception as e:
            logger.error(f"Failed to detect GPUs using GPUtil: {e}")
    
    def get_hardware_info(self) -> Dict[str, Any]:
        """
        Get hardware information
        
        Returns:
            Hardware information dictionary
        """
        gpu_type = "None"
        vram = "0GB"
        
        if self.gpus:
            gpu_type = self.gpus[0]["name"]
            vram = f"{int(self.gpus[0]['total_memory_mb'] / 1024)}GB"
        
        return {
            "gpu_type": gpu_type,
            "vram": vram,
            "cpu_cores": self.cpu_info.get("cores_logical", 0),
            "ram": f"{int(self.memory_info.get('total_gb', 0))}GB"
        }
    
    def get_resource_usage(self) -> Dict[str, Any]:
        """
        Get current resource usage
        
        Returns:
            Resource usage dictionary
        """
        # Update memory info
        mem = psutil.virtual_memory()
        
        # Update GPU info if available
        gpu_usage = []
        if HAS_NVML and self.gpus:
            for i, gpu in enumerate(self.gpus):
                try:
                    handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                    memory_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                    utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
                    
                    gpu_usage.append({
                        "index": i,
                        "memory_used_mb": memory_info.used / (1024 * 1024),
                        "memory_used_percent": (memory_info.used / memory_info.total) * 100,
                        "utilization_percent": utilization.gpu
                    })
                except Exception as e:
                    logger.error(f"Failed to get GPU {i} usage: {e}")
        
        return {
            "cpu_percent": psutil.cpu_percent(),
            "memory_used_gb": mem.used / (1024 ** 3),
            "memory_used_percent": mem.percent,
            "gpu_usage": gpu_usage
        }
    
    def allocate_resources(self, model_id: str) -> Dict[str, Any]:
        """
        Allocate resources for a model
        
        Args:
            model_id: Model ID
            
        Returns:
            Resource allocation dictionary
        """
        # This is a simplified version - in a real implementation,
        # you would need to track resource usage and allocate based on model requirements
        
        # For now, just return the first GPU if available
        if self.gpus:
            return {
                "gpu_index": 0,
                "cpu_cores": min(4, self.cpu_info.get("available_cores", 1)),
                "memory_limit_mb": 8192
            }
        else:
            return {
                "gpu_index": None,
                "cpu_cores": min(2, self.cpu_info.get("available_cores", 1)),
                "memory_limit_mb": 4096
            }
