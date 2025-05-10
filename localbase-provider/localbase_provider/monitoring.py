"""
Monitoring and Alerting System for LocalBase Provider Node
"""

import os
import json
import time
import logging
import threading
import socket
import platform
import subprocess
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
import psutil

logger = logging.getLogger(__name__)

class MonitoringSystem:
    """
    Monitoring and alerting system for the provider node
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the monitoring system
        
        Args:
            config: Monitoring configuration
        """
        self.config = config
        self.metrics_dir = config.get("metrics_dir", "/var/lib/localbase/metrics")
        self.log_dir = config.get("log_dir", "/var/log/localbase")
        self.alert_handlers = []
        self.metrics = {}
        self.thresholds = config.get("thresholds", {
            "cpu_usage": 90,  # 90% CPU usage
            "memory_usage": 90,  # 90% memory usage
            "disk_usage": 90,  # 90% disk usage
            "gpu_usage": 90,  # 90% GPU usage
            "gpu_memory_usage": 90,  # 90% GPU memory usage
            "job_error_rate": 5,  # 5% job error rate
            "job_queue_size": 100,  # 100 jobs in queue
            "job_processing_time": 300,  # 5 minutes
        })
        self.collection_interval = config.get("collection_interval", 60)  # 60 seconds
        self.retention_period = config.get("retention_period", 7)  # 7 days
        self.alert_cooldown = config.get("alert_cooldown", 300)  # 5 minutes
        self.last_alerts = {}
        self.running = False
        self.collection_thread = None
        self.cleanup_thread = None
        
        # Create directories if they don't exist
        os.makedirs(self.metrics_dir, exist_ok=True)
        os.makedirs(self.log_dir, exist_ok=True)
        
        # Initialize metrics
        self._init_metrics()
        
        logger.info("Monitoring System initialized")
    
    def _init_metrics(self):
        """
        Initialize metrics
        """
        self.metrics = {
            "system": {
                "cpu_usage": 0.0,
                "memory_usage": 0.0,
                "disk_usage": 0.0,
                "network_rx_bytes": 0,
                "network_tx_bytes": 0,
                "load_average": [0.0, 0.0, 0.0],
                "uptime": 0,
                "boot_time": 0,
                "process_count": 0,
                "thread_count": 0,
                "open_files": 0,
                "hostname": socket.gethostname(),
                "platform": platform.platform(),
                "python_version": platform.python_version(),
            },
            "gpu": {
                "count": 0,
                "devices": [],
            },
            "jobs": {
                "total": 0,
                "pending": 0,
                "processing": 0,
                "completed": 0,
                "failed": 0,
                "error_rate": 0.0,
                "avg_processing_time": 0.0,
                "throughput": 0.0,
            },
            "models": {
                "count": 0,
                "loaded": 0,
                "memory_usage": 0,
            },
            "blockchain": {
                "connected": False,
                "height": 0,
                "sync_status": 0.0,
                "peers": 0,
            },
            "timestamp": time.time(),
        }
    
    def start(self):
        """
        Start the monitoring system
        """
        if self.running:
            logger.warning("Monitoring system already running")
            return
        
        logger.info("Starting monitoring system")
        
        self.running = True
        
        # Start metrics collection thread
        self.collection_thread = threading.Thread(target=self._collect_metrics_loop)
        self.collection_thread.daemon = True
        self.collection_thread.start()
        
        # Start metrics cleanup thread
        self.cleanup_thread = threading.Thread(target=self._cleanup_metrics_loop)
        self.cleanup_thread.daemon = True
        self.cleanup_thread.start()
        
        logger.info("Monitoring system started")
    
    def stop(self):
        """
        Stop the monitoring system
        """
        if not self.running:
            logger.warning("Monitoring system not running")
            return
        
        logger.info("Stopping monitoring system")
        
        self.running = False
        
        # Wait for threads to stop
        if self.collection_thread:
            self.collection_thread.join(timeout=5)
        
        if self.cleanup_thread:
            self.cleanup_thread.join(timeout=5)
        
        logger.info("Monitoring system stopped")
    
    def register_alert_handler(self, handler: Callable[[str, Dict[str, Any]], None]):
        """
        Register an alert handler
        
        Args:
            handler: Alert handler function
        """
        self.alert_handlers.append(handler)
        logger.info(f"Alert handler registered: {handler.__name__}")
    
    def _collect_metrics_loop(self):
        """
        Metrics collection loop
        """
        while self.running:
            try:
                # Collect metrics
                self._collect_metrics()
                
                # Save metrics
                self._save_metrics()
                
                # Check thresholds and send alerts
                self._check_thresholds()
                
            except Exception as e:
                logger.error(f"Error collecting metrics: {e}")
            
            # Sleep until next collection
            time.sleep(self.collection_interval)
    
    def _cleanup_metrics_loop(self):
        """
        Metrics cleanup loop
        """
        while self.running:
            try:
                # Clean up old metrics
                self._cleanup_old_metrics()
                
            except Exception as e:
                logger.error(f"Error cleaning up metrics: {e}")
            
            # Sleep for 1 hour
            time.sleep(3600)
    
    def _collect_metrics(self):
        """
        Collect system and application metrics
        """
        # Update timestamp
        self.metrics["timestamp"] = time.time()
        
        # Collect system metrics
        self._collect_system_metrics()
        
        # Collect GPU metrics
        self._collect_gpu_metrics()
        
        # Collect job metrics
        self._collect_job_metrics()
        
        # Collect model metrics
        self._collect_model_metrics()
        
        # Collect blockchain metrics
        self._collect_blockchain_metrics()
    
    def _collect_system_metrics(self):
        """
        Collect system metrics
        """
        # CPU usage
        self.metrics["system"]["cpu_usage"] = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        self.metrics["system"]["memory_usage"] = memory.percent
        
        # Disk usage
        disk = psutil.disk_usage("/")
        self.metrics["system"]["disk_usage"] = disk.percent
        
        # Network I/O
        net_io = psutil.net_io_counters()
        self.metrics["system"]["network_rx_bytes"] = net_io.bytes_recv
        self.metrics["system"]["network_tx_bytes"] = net_io.bytes_sent
        
        # Load average
        self.metrics["system"]["load_average"] = [x / psutil.cpu_count() * 100 for x in psutil.getloadavg()]
        
        # Uptime and boot time
        self.metrics["system"]["boot_time"] = psutil.boot_time()
        self.metrics["system"]["uptime"] = time.time() - psutil.boot_time()
        
        # Process and thread count
        self.metrics["system"]["process_count"] = len(psutil.pids())
        thread_count = 0
        for proc in psutil.process_iter(['pid', 'num_threads']):
            try:
                thread_count += proc.info['num_threads']
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        self.metrics["system"]["thread_count"] = thread_count
        
        # Open files
        try:
            self.metrics["system"]["open_files"] = len(subprocess.check_output(['lsof', '-n']).splitlines())
        except (subprocess.SubprocessError, FileNotFoundError):
            self.metrics["system"]["open_files"] = 0
    
    def _collect_gpu_metrics(self):
        """
        Collect GPU metrics
        """
        try:
            # Try to import GPU monitoring libraries
            try:
                import pynvml
                has_nvidia = True
            except ImportError:
                has_nvidia = False
            
            try:
                from pyamdgpuinfo import get_gpu_info
                has_amd = True
            except ImportError:
                has_amd = False
            
            # Collect NVIDIA GPU metrics
            if has_nvidia:
                try:
                    pynvml.nvmlInit()
                    device_count = pynvml.nvmlDeviceGetCount()
                    
                    self.metrics["gpu"]["count"] = device_count
                    self.metrics["gpu"]["devices"] = []
                    
                    for i in range(device_count):
                        handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                        name = pynvml.nvmlDeviceGetName(handle)
                        memory = pynvml.nvmlDeviceGetMemoryInfo(handle)
                        utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
                        temperature = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                        power = pynvml.nvmlDeviceGetPowerUsage(handle) / 1000.0
                        
                        self.metrics["gpu"]["devices"].append({
                            "index": i,
                            "name": name,
                            "type": "nvidia",
                            "memory_total": memory.total,
                            "memory_used": memory.used,
                            "memory_free": memory.free,
                            "memory_usage": (memory.used / memory.total) * 100,
                            "gpu_usage": utilization.gpu,
                            "memory_utilization": utilization.memory,
                            "temperature": temperature,
                            "power_usage": power,
                        })
                    
                    pynvml.nvmlShutdown()
                    
                except Exception as e:
                    logger.error(f"Error collecting NVIDIA GPU metrics: {e}")
            
            # Collect AMD GPU metrics
            if has_amd:
                try:
                    gpus = get_gpu_info()
                    
                    if not self.metrics["gpu"]["devices"]:
                        self.metrics["gpu"]["count"] = len(gpus)
                        self.metrics["gpu"]["devices"] = []
                    else:
                        self.metrics["gpu"]["count"] += len(gpus)
                    
                    for i, gpu in enumerate(gpus):
                        self.metrics["gpu"]["devices"].append({
                            "index": i,
                            "name": gpu.name,
                            "type": "amd",
                            "memory_total": gpu.memory_total,
                            "memory_used": gpu.memory_used,
                            "memory_free": gpu.memory_total - gpu.memory_used,
                            "memory_usage": (gpu.memory_used / gpu.memory_total) * 100 if gpu.memory_total > 0 else 0,
                            "gpu_usage": gpu.gpu_usage,
                            "temperature": gpu.temperature,
                            "power_usage": gpu.power_usage,
                        })
                        
                except Exception as e:
                    logger.error(f"Error collecting AMD GPU metrics: {e}")
            
        except Exception as e:
            logger.error(f"Error collecting GPU metrics: {e}")
    
    def _collect_job_metrics(self):
        """
        Collect job metrics
        """
        # This would typically be populated by the job manager
        # For now, we'll just use placeholder values
        pass
    
    def _collect_model_metrics(self):
        """
        Collect model metrics
        """
        # This would typically be populated by the model registry
        # For now, we'll just use placeholder values
        pass
    
    def _collect_blockchain_metrics(self):
        """
        Collect blockchain metrics
        """
        # This would typically be populated by the blockchain client
        # For now, we'll just use placeholder values
        pass
    
    def _save_metrics(self):
        """
        Save metrics to disk
        """
        # Create metrics filename based on timestamp
        timestamp = int(self.metrics["timestamp"])
        date_str = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
        time_str = datetime.fromtimestamp(timestamp).strftime("%H-%M-%S")
        
        # Create directory for date if it doesn't exist
        date_dir = os.path.join(self.metrics_dir, date_str)
        os.makedirs(date_dir, exist_ok=True)
        
        # Save metrics to file
        metrics_file = os.path.join(date_dir, f"{time_str}.json")
        
        with open(metrics_file, "w") as f:
            json.dump(self.metrics, f, indent=2)
    
    def _cleanup_old_metrics(self):
        """
        Clean up old metrics files
        """
        # Calculate cutoff date
        cutoff_date = datetime.now() - timedelta(days=self.retention_period)
        cutoff_str = cutoff_date.strftime("%Y-%m-%d")
        
        # List directories in metrics dir
        for date_dir in os.listdir(self.metrics_dir):
            # Skip if not a directory
            if not os.path.isdir(os.path.join(self.metrics_dir, date_dir)):
                continue
            
            # Check if directory is older than cutoff date
            if date_dir < cutoff_str:
                # Remove directory and all contents
                import shutil
                shutil.rmtree(os.path.join(self.metrics_dir, date_dir))
                logger.info(f"Cleaned up old metrics: {date_dir}")
    
    def _check_thresholds(self):
        """
        Check metrics against thresholds and send alerts
        """
        alerts = []
        
        # Check system metrics
        if self.metrics["system"]["cpu_usage"] > self.thresholds["cpu_usage"]:
            alerts.append(("system.cpu_usage", {
                "metric": "CPU Usage",
                "value": self.metrics["system"]["cpu_usage"],
                "threshold": self.thresholds["cpu_usage"],
                "message": f"CPU usage is {self.metrics['system']['cpu_usage']}%, threshold is {self.thresholds['cpu_usage']}%"
            }))
        
        if self.metrics["system"]["memory_usage"] > self.thresholds["memory_usage"]:
            alerts.append(("system.memory_usage", {
                "metric": "Memory Usage",
                "value": self.metrics["system"]["memory_usage"],
                "threshold": self.thresholds["memory_usage"],
                "message": f"Memory usage is {self.metrics['system']['memory_usage']}%, threshold is {self.thresholds['memory_usage']}%"
            }))
        
        if self.metrics["system"]["disk_usage"] > self.thresholds["disk_usage"]:
            alerts.append(("system.disk_usage", {
                "metric": "Disk Usage",
                "value": self.metrics["system"]["disk_usage"],
                "threshold": self.thresholds["disk_usage"],
                "message": f"Disk usage is {self.metrics['system']['disk_usage']}%, threshold is {self.thresholds['disk_usage']}%"
            }))
        
        # Check GPU metrics
        for i, gpu in enumerate(self.metrics["gpu"]["devices"]):
            if gpu["gpu_usage"] > self.thresholds["gpu_usage"]:
                alerts.append((f"gpu.{i}.gpu_usage", {
                    "metric": f"GPU {i} Usage",
                    "value": gpu["gpu_usage"],
                    "threshold": self.thresholds["gpu_usage"],
                    "message": f"GPU {i} ({gpu['name']}) usage is {gpu['gpu_usage']}%, threshold is {self.thresholds['gpu_usage']}%"
                }))
            
            if gpu["memory_usage"] > self.thresholds["gpu_memory_usage"]:
                alerts.append((f"gpu.{i}.memory_usage", {
                    "metric": f"GPU {i} Memory Usage",
                    "value": gpu["memory_usage"],
                    "threshold": self.thresholds["gpu_memory_usage"],
                    "message": f"GPU {i} ({gpu['name']}) memory usage is {gpu['memory_usage']}%, threshold is {self.thresholds['gpu_memory_usage']}%"
                }))
        
        # Check job metrics
        if self.metrics["jobs"]["error_rate"] > self.thresholds["job_error_rate"]:
            alerts.append(("jobs.error_rate", {
                "metric": "Job Error Rate",
                "value": self.metrics["jobs"]["error_rate"],
                "threshold": self.thresholds["job_error_rate"],
                "message": f"Job error rate is {self.metrics['jobs']['error_rate']}%, threshold is {self.thresholds['job_error_rate']}%"
            }))
        
        if self.metrics["jobs"]["pending"] > self.thresholds["job_queue_size"]:
            alerts.append(("jobs.queue_size", {
                "metric": "Job Queue Size",
                "value": self.metrics["jobs"]["pending"],
                "threshold": self.thresholds["job_queue_size"],
                "message": f"Job queue size is {self.metrics['jobs']['pending']}, threshold is {self.thresholds['job_queue_size']}"
            }))
        
        if self.metrics["jobs"]["avg_processing_time"] > self.thresholds["job_processing_time"]:
            alerts.append(("jobs.processing_time", {
                "metric": "Job Processing Time",
                "value": self.metrics["jobs"]["avg_processing_time"],
                "threshold": self.thresholds["job_processing_time"],
                "message": f"Average job processing time is {self.metrics['jobs']['avg_processing_time']} seconds, threshold is {self.thresholds['job_processing_time']} seconds"
            }))
        
        # Send alerts
        for alert_id, alert_data in alerts:
            # Check if alert is in cooldown
            if alert_id in self.last_alerts:
                if time.time() - self.last_alerts[alert_id] < self.alert_cooldown:
                    continue
            
            # Update last alert time
            self.last_alerts[alert_id] = time.time()
            
            # Send alert to all handlers
            for handler in self.alert_handlers:
                try:
                    handler(alert_id, alert_data)
                except Exception as e:
                    logger.error(f"Error sending alert to handler {handler.__name__}: {e}")
    
    def get_current_metrics(self) -> Dict[str, Any]:
        """
        Get current metrics
        
        Returns:
            Current metrics
        """
        return self.metrics
    
    def get_historical_metrics(self, start_time: float, end_time: float) -> List[Dict[str, Any]]:
        """
        Get historical metrics
        
        Args:
            start_time: Start time (Unix timestamp)
            end_time: End time (Unix timestamp)
            
        Returns:
            List of metrics
        """
        metrics = []
        
        # Convert timestamps to datetime
        start_date = datetime.fromtimestamp(start_time)
        end_date = datetime.fromtimestamp(end_time)
        
        # Iterate over dates
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            date_dir = os.path.join(self.metrics_dir, date_str)
            
            # Skip if directory doesn't exist
            if not os.path.exists(date_dir):
                current_date += timedelta(days=1)
                continue
            
            # Iterate over metrics files
            for filename in os.listdir(date_dir):
                if not filename.endswith(".json"):
                    continue
                
                # Load metrics
                metrics_file = os.path.join(date_dir, filename)
                
                try:
                    with open(metrics_file, "r") as f:
                        metric_data = json.load(f)
                    
                    # Check if metric is within time range
                    if start_time <= metric_data["timestamp"] <= end_time:
                        metrics.append(metric_data)
                        
                except Exception as e:
                    logger.error(f"Error loading metrics file {metrics_file}: {e}")
            
            # Move to next date
            current_date += timedelta(days=1)
        
        # Sort metrics by timestamp
        metrics.sort(key=lambda x: x["timestamp"])
        
        return metrics
    
    def update_job_metrics(self, job_metrics: Dict[str, Any]):
        """
        Update job metrics
        
        Args:
            job_metrics: Job metrics
        """
        self.metrics["jobs"].update(job_metrics)
    
    def update_model_metrics(self, model_metrics: Dict[str, Any]):
        """
        Update model metrics
        
        Args:
            model_metrics: Model metrics
        """
        self.metrics["models"].update(model_metrics)
    
    def update_blockchain_metrics(self, blockchain_metrics: Dict[str, Any]):
        """
        Update blockchain metrics
        
        Args:
            blockchain_metrics: Blockchain metrics
        """
        self.metrics["blockchain"].update(blockchain_metrics)
    
    def set_threshold(self, metric: str, value: float):
        """
        Set threshold for a metric
        
        Args:
            metric: Metric name
            value: Threshold value
        """
        self.thresholds[metric] = value
        logger.info(f"Threshold set: {metric} = {value}")
    
    def get_threshold(self, metric: str) -> float:
        """
        Get threshold for a metric
        
        Args:
            metric: Metric name
            
        Returns:
            Threshold value
        """
        return self.thresholds.get(metric, 0.0)
    
    def get_all_thresholds(self) -> Dict[str, float]:
        """
        Get all thresholds
        
        Returns:
            Dictionary of thresholds
        """
        return self.thresholds


# Alert handlers
def email_alert_handler(alert_id: str, alert_data: Dict[str, Any]):
    """
    Email alert handler
    
    Args:
        alert_id: Alert ID
        alert_data: Alert data
    """
    logger.info(f"Email alert: {alert_id} - {alert_data['message']}")
    
    # In a real implementation, this would send an email
    # For now, we'll just log the alert

def slack_alert_handler(alert_id: str, alert_data: Dict[str, Any]):
    """
    Slack alert handler
    
    Args:
        alert_id: Alert ID
        alert_data: Alert data
    """
    logger.info(f"Slack alert: {alert_id} - {alert_data['message']}")
    
    # In a real implementation, this would send a Slack message
    # For now, we'll just log the alert

def webhook_alert_handler(alert_id: str, alert_data: Dict[str, Any]):
    """
    Webhook alert handler
    
    Args:
        alert_id: Alert ID
        alert_data: Alert data
    """
    logger.info(f"Webhook alert: {alert_id} - {alert_data['message']}")
    
    # In a real implementation, this would send a webhook request
    # For now, we'll just log the alert
