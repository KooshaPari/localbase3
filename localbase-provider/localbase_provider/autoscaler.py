"""
Automatic Scaling System for LocalBase Provider Node
"""

import os
import json
import time
import logging
import threading
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
import psutil

logger = logging.getLogger(__name__)

class AutoScaler:
    """
    Automatic scaling system for the provider node
    """
    
    def __init__(self, config: Dict[str, Any], monitoring_system=None):
        """
        Initialize the auto scaler
        
        Args:
            config: Auto scaler configuration
            monitoring_system: Monitoring system instance
        """
        self.config = config
        self.monitoring_system = monitoring_system
        self.scaling_dir = config.get("scaling_dir", "/var/lib/localbase/scaling")
        self.min_workers = config.get("min_workers", 1)
        self.max_workers = config.get("max_workers", 10)
        self.current_workers = config.get("initial_workers", 1)
        self.target_cpu_usage = config.get("target_cpu_usage", 70)  # 70% CPU usage
        self.target_gpu_usage = config.get("target_gpu_usage", 80)  # 80% GPU usage
        self.target_memory_usage = config.get("target_memory_usage", 80)  # 80% memory usage
        self.scale_up_threshold = config.get("scale_up_threshold", 85)  # 85% resource usage
        self.scale_down_threshold = config.get("scale_down_threshold", 50)  # 50% resource usage
        self.scale_up_factor = config.get("scale_up_factor", 1.5)  # Scale up by 50%
        self.scale_down_factor = config.get("scale_down_factor", 0.8)  # Scale down by 20%
        self.cooldown_period = config.get("cooldown_period", 300)  # 5 minutes
        self.last_scale_time = 0
        self.scaling_enabled = config.get("scaling_enabled", True)
        self.running = False
        self.scaling_thread = None
        self.scaling_history = []
        self.scaling_callbacks = []
        
        # Create scaling directory if it doesn't exist
        os.makedirs(self.scaling_dir, exist_ok=True)
        
        logger.info("Auto Scaler initialized")
    
    def start(self):
        """
        Start the auto scaler
        """
        if self.running:
            logger.warning("Auto scaler already running")
            return
        
        logger.info("Starting auto scaler")
        
        self.running = True
        
        # Start scaling thread
        self.scaling_thread = threading.Thread(target=self._scaling_loop)
        self.scaling_thread.daemon = True
        self.scaling_thread.start()
        
        logger.info("Auto scaler started")
    
    def stop(self):
        """
        Stop the auto scaler
        """
        if not self.running:
            logger.warning("Auto scaler not running")
            return
        
        logger.info("Stopping auto scaler")
        
        self.running = False
        
        # Wait for thread to stop
        if self.scaling_thread:
            self.scaling_thread.join(timeout=5)
        
        logger.info("Auto scaler stopped")
    
    def register_scaling_callback(self, callback: Callable[[int, int, str], None]):
        """
        Register a scaling callback
        
        Args:
            callback: Scaling callback function
        """
        self.scaling_callbacks.append(callback)
        logger.info(f"Scaling callback registered: {callback.__name__}")
    
    def _scaling_loop(self):
        """
        Scaling loop
        """
        while self.running:
            try:
                # Check if scaling is enabled
                if not self.scaling_enabled:
                    time.sleep(60)
                    continue
                
                # Check if in cooldown period
                if time.time() - self.last_scale_time < self.cooldown_period:
                    time.sleep(60)
                    continue
                
                # Get current metrics
                metrics = self._get_current_metrics()
                
                # Calculate scaling decision
                decision = self._calculate_scaling_decision(metrics)
                
                # Apply scaling decision
                if decision["action"] != "none":
                    self._apply_scaling_decision(decision)
                
            except Exception as e:
                logger.error(f"Error in scaling loop: {e}")
            
            # Sleep for 60 seconds
            time.sleep(60)
    
    def _get_current_metrics(self) -> Dict[str, Any]:
        """
        Get current metrics
        
        Returns:
            Current metrics
        """
        if self.monitoring_system:
            return self.monitoring_system.get_current_metrics()
        
        # If no monitoring system, collect basic metrics
        metrics = {
            "system": {
                "cpu_usage": psutil.cpu_percent(interval=1),
                "memory_usage": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage("/").percent,
            },
            "gpu": {
                "count": 0,
                "devices": [],
            },
            "jobs": {
                "pending": 0,
                "processing": 0,
            },
            "timestamp": time.time(),
        }
        
        return metrics
    
    def _calculate_scaling_decision(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate scaling decision based on metrics
        
        Args:
            metrics: Current metrics
            
        Returns:
            Scaling decision
        """
        decision = {
            "action": "none",
            "reason": "",
            "current_workers": self.current_workers,
            "target_workers": self.current_workers,
            "timestamp": time.time(),
        }
        
        # Check if we have enough metrics
        if not metrics or "system" not in metrics:
            decision["reason"] = "Insufficient metrics"
            return decision
        
        # Get resource usage
        cpu_usage = metrics["system"].get("cpu_usage", 0)
        memory_usage = metrics["system"].get("memory_usage", 0)
        
        # Get GPU usage if available
        gpu_usage = 0
        if "gpu" in metrics and metrics["gpu"].get("count", 0) > 0:
            gpu_usages = [device.get("gpu_usage", 0) for device in metrics["gpu"].get("devices", [])]
            gpu_usage = sum(gpu_usages) / len(gpu_usages) if gpu_usages else 0
        
        # Get job queue size
        job_queue_size = metrics["jobs"].get("pending", 0)
        
        # Calculate resource pressure
        resource_pressure = max(cpu_usage, memory_usage, gpu_usage)
        
        # Scale up if resource pressure is high or job queue is growing
        if resource_pressure > self.scale_up_threshold or job_queue_size > self.current_workers * 5:
            # Calculate target workers
            target_workers = int(self.current_workers * self.scale_up_factor)
            
            # Ensure target workers is within limits
            target_workers = max(self.min_workers, min(self.max_workers, target_workers))
            
            # Check if we need to scale up
            if target_workers > self.current_workers:
                decision["action"] = "scale_up"
                decision["reason"] = f"Resource pressure: {resource_pressure}%, Job queue: {job_queue_size}"
                decision["target_workers"] = target_workers
        
        # Scale down if resource pressure is low and job queue is small
        elif resource_pressure < self.scale_down_threshold and job_queue_size < self.current_workers:
            # Calculate target workers
            target_workers = max(int(self.current_workers * self.scale_down_factor), self.min_workers)
            
            # Check if we need to scale down
            if target_workers < self.current_workers:
                decision["action"] = "scale_down"
                decision["reason"] = f"Resource pressure: {resource_pressure}%, Job queue: {job_queue_size}"
                decision["target_workers"] = target_workers
        
        return decision
    
    def _apply_scaling_decision(self, decision: Dict[str, Any]):
        """
        Apply scaling decision
        
        Args:
            decision: Scaling decision
        """
        # Get current and target workers
        current_workers = decision["current_workers"]
        target_workers = decision["target_workers"]
        
        # Log scaling decision
        logger.info(f"Scaling {decision['action']} from {current_workers} to {target_workers} workers: {decision['reason']}")
        
        # Update current workers
        self.current_workers = target_workers
        
        # Update last scale time
        self.last_scale_time = time.time()
        
        # Add to scaling history
        self.scaling_history.append(decision)
        
        # Save scaling history
        self._save_scaling_history()
        
        # Call scaling callbacks
        for callback in self.scaling_callbacks:
            try:
                callback(current_workers, target_workers, decision["action"])
            except Exception as e:
                logger.error(f"Error calling scaling callback {callback.__name__}: {e}")
    
    def _save_scaling_history(self):
        """
        Save scaling history to disk
        """
        # Create scaling history filename
        history_file = os.path.join(self.scaling_dir, "scaling_history.json")
        
        # Save scaling history to file
        with open(history_file, "w") as f:
            json.dump(self.scaling_history, f, indent=2)
    
    def get_scaling_history(self) -> List[Dict[str, Any]]:
        """
        Get scaling history
        
        Returns:
            Scaling history
        """
        return self.scaling_history
    
    def get_current_workers(self) -> int:
        """
        Get current number of workers
        
        Returns:
            Current number of workers
        """
        return self.current_workers
    
    def set_scaling_enabled(self, enabled: bool):
        """
        Enable or disable automatic scaling
        
        Args:
            enabled: Whether scaling is enabled
        """
        self.scaling_enabled = enabled
        logger.info(f"Automatic scaling {'enabled' if enabled else 'disabled'}")
    
    def set_min_workers(self, min_workers: int):
        """
        Set minimum number of workers
        
        Args:
            min_workers: Minimum number of workers
        """
        self.min_workers = max(1, min_workers)
        logger.info(f"Minimum workers set to {self.min_workers}")
    
    def set_max_workers(self, max_workers: int):
        """
        Set maximum number of workers
        
        Args:
            max_workers: Maximum number of workers
        """
        self.max_workers = max(self.min_workers, max_workers)
        logger.info(f"Maximum workers set to {self.max_workers}")
    
    def set_target_usage(self, cpu_usage: Optional[float] = None, gpu_usage: Optional[float] = None, memory_usage: Optional[float] = None):
        """
        Set target resource usage
        
        Args:
            cpu_usage: Target CPU usage
            gpu_usage: Target GPU usage
            memory_usage: Target memory usage
        """
        if cpu_usage is not None:
            self.target_cpu_usage = max(0, min(100, cpu_usage))
            logger.info(f"Target CPU usage set to {self.target_cpu_usage}%")
        
        if gpu_usage is not None:
            self.target_gpu_usage = max(0, min(100, gpu_usage))
            logger.info(f"Target GPU usage set to {self.target_gpu_usage}%")
        
        if memory_usage is not None:
            self.target_memory_usage = max(0, min(100, memory_usage))
            logger.info(f"Target memory usage set to {self.target_memory_usage}%")
    
    def set_scale_thresholds(self, scale_up_threshold: Optional[float] = None, scale_down_threshold: Optional[float] = None):
        """
        Set scale up and down thresholds
        
        Args:
            scale_up_threshold: Scale up threshold
            scale_down_threshold: Scale down threshold
        """
        if scale_up_threshold is not None:
            self.scale_up_threshold = max(0, min(100, scale_up_threshold))
            logger.info(f"Scale up threshold set to {self.scale_up_threshold}%")
        
        if scale_down_threshold is not None:
            self.scale_down_threshold = max(0, min(100, scale_down_threshold))
            logger.info(f"Scale down threshold set to {self.scale_down_threshold}%")
    
    def set_scale_factors(self, scale_up_factor: Optional[float] = None, scale_down_factor: Optional[float] = None):
        """
        Set scale up and down factors
        
        Args:
            scale_up_factor: Scale up factor
            scale_down_factor: Scale down factor
        """
        if scale_up_factor is not None:
            self.scale_up_factor = max(1.0, scale_up_factor)
            logger.info(f"Scale up factor set to {self.scale_up_factor}")
        
        if scale_down_factor is not None:
            self.scale_down_factor = max(0.1, min(1.0, scale_down_factor))
            logger.info(f"Scale down factor set to {self.scale_down_factor}")
    
    def set_cooldown_period(self, cooldown_period: int):
        """
        Set cooldown period
        
        Args:
            cooldown_period: Cooldown period in seconds
        """
        self.cooldown_period = max(60, cooldown_period)
        logger.info(f"Cooldown period set to {self.cooldown_period} seconds")
    
    def manual_scale(self, target_workers: int, reason: str = "Manual scaling"):
        """
        Manually scale to a specific number of workers
        
        Args:
            target_workers: Target number of workers
            reason: Reason for scaling
        """
        # Ensure target workers is within limits
        target_workers = max(self.min_workers, min(self.max_workers, target_workers))
        
        # Create scaling decision
        decision = {
            "action": "manual",
            "reason": reason,
            "current_workers": self.current_workers,
            "target_workers": target_workers,
            "timestamp": time.time(),
        }
        
        # Apply scaling decision
        self._apply_scaling_decision(decision)


# Scaling callbacks
def docker_scaling_callback(current_workers: int, target_workers: int, action: str):
    """
    Docker scaling callback
    
    Args:
        current_workers: Current number of workers
        target_workers: Target number of workers
        action: Scaling action
    """
    logger.info(f"Docker scaling: {action} from {current_workers} to {target_workers} workers")
    
    # In a real implementation, this would scale Docker containers
    # For now, we'll just log the scaling action

def kubernetes_scaling_callback(current_workers: int, target_workers: int, action: str):
    """
    Kubernetes scaling callback
    
    Args:
        current_workers: Current number of workers
        target_workers: Target number of workers
        action: Scaling action
    """
    logger.info(f"Kubernetes scaling: {action} from {current_workers} to {target_workers} workers")
    
    # In a real implementation, this would scale Kubernetes pods
    # For now, we'll just log the scaling action

def process_scaling_callback(current_workers: int, target_workers: int, action: str):
    """
    Process scaling callback
    
    Args:
        current_workers: Current number of workers
        target_workers: Target number of workers
        action: Scaling action
    """
    logger.info(f"Process scaling: {action} from {current_workers} to {target_workers} workers")
    
    # In a real implementation, this would start or stop worker processes
    # For now, we'll just log the scaling action
