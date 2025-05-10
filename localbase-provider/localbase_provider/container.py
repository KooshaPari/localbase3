"""
Container Manager for LocalBase Provider Node
"""

import os
import json
import logging
import docker
import tempfile
import time
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class ContainerManager:
    """
    Manages Docker containers for workload isolation
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the container manager
        
        Args:
            config: Security configuration
        """
        self.config = config
        self.max_memory_per_job = config.get("max_memory_per_job", 24000)  # MB
        self.max_cpu_per_job = config.get("max_cpu_per_job", 8)  # CPU cores
        self.network_isolation = config.get("network_isolation", True)
        self.allowed_outbound_hosts = config.get("allowed_outbound_hosts", [])
        
        self.client = None
        self.containers = {}
        
        logger.info("Container Manager initialized")
    
    def initialize(self):
        """
        Initialize the container manager
        """
        logger.info("Initializing Container Manager")
        
        try:
            # Initialize Docker client
            self.client = docker.from_env()
            
            # Check Docker connection
            version = self.client.version()
            logger.info(f"Connected to Docker: {version.get('Version', 'unknown')}")
            
            # Check for existing containers
            self._cleanup_containers()
            
        except Exception as e:
            logger.error(f"Failed to initialize Docker client: {e}")
            raise
    
    def create_container(self, job_id: str, model_id: str, resources: Dict[str, Any]) -> Optional[str]:
        """
        Create a container for a job
        
        Args:
            job_id: Job ID
            model_id: Model ID
            resources: Resource allocation
            
        Returns:
            Container ID or None if failed
        """
        if not self.client:
            logger.error("Docker client not initialized")
            return None
        
        logger.info(f"Creating container for job {job_id} with model {model_id}")
        
        try:
            # Prepare container configuration
            container_name = f"localbase-{job_id}"
            
            # Prepare resource limits
            mem_limit = f"{min(resources.get('memory_limit_mb', 0), self.max_memory_per_job)}m"
            cpu_limit = min(resources.get('cpu_cores', 0), self.max_cpu_per_job)
            
            # Prepare GPU configuration
            gpu_config = None
            if resources.get('gpu_index') is not None:
                gpu_config = {
                    'count': 1,
                    'device_ids': [str(resources['gpu_index'])],
                    'capabilities': ['gpu', 'utility', 'compute']
                }
            
            # Prepare network configuration
            network_config = None
            if self.network_isolation:
                if self.allowed_outbound_hosts:
                    # Create custom network with limited access
                    network_config = 'host'  # For simplicity, use host network
                    # In a real implementation, we would create a custom network with limited access
                else:
                    # No outbound access
                    network_config = 'none'
            
            # Prepare volumes
            volumes = {}
            
            # Create container
            container = self.client.containers.create(
                image="localbase/inference:latest",  # This would be your inference image
                name=container_name,
                command="sleep infinity",  # Keep container running
                detach=True,
                mem_limit=mem_limit,
                nano_cpus=int(cpu_limit * 1e9),  # Convert to nano CPUs
                device_requests=[gpu_config] if gpu_config else None,
                network=network_config,
                volumes=volumes,
                environment={
                    "JOB_ID": job_id,
                    "MODEL_ID": model_id
                }
            )
            
            # Start container
            container.start()
            
            # Store container info
            self.containers[job_id] = {
                "id": container.id,
                "name": container_name,
                "model_id": model_id,
                "created_at": time.time()
            }
            
            logger.info(f"Container created for job {job_id}: {container.id}")
            
            return container.id
            
        except Exception as e:
            logger.error(f"Failed to create container for job {job_id}: {e}")
            return None
    
    def stop_container(self, job_id: str) -> bool:
        """
        Stop a container
        
        Args:
            job_id: Job ID
            
        Returns:
            Success flag
        """
        if not self.client:
            logger.error("Docker client not initialized")
            return False
        
        if job_id not in self.containers:
            logger.error(f"Container for job {job_id} not found")
            return False
        
        logger.info(f"Stopping container for job {job_id}")
        
        try:
            container_id = self.containers[job_id]["id"]
            container = self.client.containers.get(container_id)
            
            # Stop container
            container.stop(timeout=10)
            
            # Remove container
            container.remove(force=True)
            
            # Remove from containers dict
            del self.containers[job_id]
            
            logger.info(f"Container for job {job_id} stopped and removed")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to stop container for job {job_id}: {e}")
            return False
    
    def execute_command(self, job_id: str, command: str) -> Optional[Dict[str, Any]]:
        """
        Execute a command in a container
        
        Args:
            job_id: Job ID
            command: Command to execute
            
        Returns:
            Command result or None if failed
        """
        if not self.client:
            logger.error("Docker client not initialized")
            return None
        
        if job_id not in self.containers:
            logger.error(f"Container for job {job_id} not found")
            return None
        
        logger.info(f"Executing command in container for job {job_id}: {command}")
        
        try:
            container_id = self.containers[job_id]["id"]
            container = self.client.containers.get(container_id)
            
            # Execute command
            exec_result = container.exec_run(command)
            
            return {
                "exit_code": exec_result.exit_code,
                "output": exec_result.output.decode('utf-8')
            }
            
        except Exception as e:
            logger.error(f"Failed to execute command in container for job {job_id}: {e}")
            return None
    
    def copy_to_container(self, job_id: str, source_path: str, dest_path: str) -> bool:
        """
        Copy a file to a container
        
        Args:
            job_id: Job ID
            source_path: Source path on host
            dest_path: Destination path in container
            
        Returns:
            Success flag
        """
        if not self.client:
            logger.error("Docker client not initialized")
            return False
        
        if job_id not in self.containers:
            logger.error(f"Container for job {job_id} not found")
            return False
        
        logger.info(f"Copying file to container for job {job_id}: {source_path} -> {dest_path}")
        
        try:
            container_id = self.containers[job_id]["id"]
            container = self.client.containers.get(container_id)
            
            # Create a tar archive
            with tempfile.NamedTemporaryFile() as tar_file:
                import tarfile
                with tarfile.open(fileobj=tar_file, mode='w') as tar:
                    tar.add(source_path, arcname=os.path.basename(dest_path))
                
                tar_file.flush()
                tar_file.seek(0)
                
                # Copy to container
                container.put_archive(os.path.dirname(dest_path), tar_file.read())
            
            logger.info(f"File copied to container for job {job_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to copy file to container for job {job_id}: {e}")
            return False
    
    def copy_from_container(self, job_id: str, source_path: str, dest_path: str) -> bool:
        """
        Copy a file from a container
        
        Args:
            job_id: Job ID
            source_path: Source path in container
            dest_path: Destination path on host
            
        Returns:
            Success flag
        """
        if not self.client:
            logger.error("Docker client not initialized")
            return False
        
        if job_id not in self.containers:
            logger.error(f"Container for job {job_id} not found")
            return False
        
        logger.info(f"Copying file from container for job {job_id}: {source_path} -> {dest_path}")
        
        try:
            container_id = self.containers[job_id]["id"]
            container = self.client.containers.get(container_id)
            
            # Get archive from container
            bits, stat = container.get_archive(source_path)
            
            # Create destination directory if it doesn't exist
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            
            # Extract archive
            with tempfile.NamedTemporaryFile() as tar_file:
                for chunk in bits:
                    tar_file.write(chunk)
                
                tar_file.flush()
                tar_file.seek(0)
                
                import tarfile
                with tarfile.open(fileobj=tar_file, mode='r') as tar:
                    tar.extractall(path=os.path.dirname(dest_path))
            
            logger.info(f"File copied from container for job {job_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to copy file from container for job {job_id}: {e}")
            return False
    
    def get_container_logs(self, job_id: str) -> Optional[str]:
        """
        Get container logs
        
        Args:
            job_id: Job ID
            
        Returns:
            Container logs or None if failed
        """
        if not self.client:
            logger.error("Docker client not initialized")
            return None
        
        if job_id not in self.containers:
            logger.error(f"Container for job {job_id} not found")
            return None
        
        logger.info(f"Getting logs for container for job {job_id}")
        
        try:
            container_id = self.containers[job_id]["id"]
            container = self.client.containers.get(container_id)
            
            # Get logs
            logs = container.logs().decode('utf-8')
            
            return logs
            
        except Exception as e:
            logger.error(f"Failed to get logs for container for job {job_id}: {e}")
            return None
    
    def get_container_stats(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get container stats
        
        Args:
            job_id: Job ID
            
        Returns:
            Container stats or None if failed
        """
        if not self.client:
            logger.error("Docker client not initialized")
            return None
        
        if job_id not in self.containers:
            logger.error(f"Container for job {job_id} not found")
            return None
        
        logger.info(f"Getting stats for container for job {job_id}")
        
        try:
            container_id = self.containers[job_id]["id"]
            container = self.client.containers.get(container_id)
            
            # Get stats
            stats = container.stats(stream=False)
            
            # Extract relevant stats
            cpu_stats = stats.get('cpu_stats', {})
            memory_stats = stats.get('memory_stats', {})
            
            return {
                "cpu_usage": cpu_stats.get('cpu_usage', {}).get('total_usage', 0),
                "memory_usage": memory_stats.get('usage', 0),
                "memory_limit": memory_stats.get('limit', 0)
            }
            
        except Exception as e:
            logger.error(f"Failed to get stats for container for job {job_id}: {e}")
            return None
    
    def shutdown(self):
        """
        Shutdown the container manager
        """
        logger.info("Shutting down Container Manager")
        
        if not self.client:
            return
        
        # Stop all containers
        self._cleanup_containers()
    
    def _cleanup_containers(self):
        """
        Clean up containers
        """
        if not self.client:
            return
        
        try:
            # Get all containers with localbase prefix
            containers = self.client.containers.list(
                all=True,
                filters={"name": "localbase-"}
            )
            
            # Stop and remove containers
            for container in containers:
                logger.info(f"Cleaning up container: {container.name}")
                
                try:
                    container.stop(timeout=10)
                    container.remove(force=True)
                except Exception as e:
                    logger.error(f"Failed to clean up container {container.name}: {e}")
            
            # Clear containers dict
            self.containers = {}
            
        except Exception as e:
            logger.error(f"Failed to clean up containers: {e}")
    
    def _create_docker_image(self):
        """
        Create Docker image for inference
        """
        if not self.client:
            return
        
        try:
            # Check if image exists
            try:
                self.client.images.get("localbase/inference:latest")
                logger.info("Docker image localbase/inference:latest already exists")
                return
            except docker.errors.ImageNotFound:
                pass
            
            # Create Dockerfile
            dockerfile = """
FROM python:3.9-slim

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir \
    torch \
    transformers \
    onnxruntime \
    llama-cpp-python

# Create working directory
WORKDIR /app

# Copy inference script
COPY inference.py /app/

# Set entrypoint
ENTRYPOINT ["python", "inference.py"]
"""
            
            # Create inference script
            inference_script = """
import os
import sys
import json
import time

def main():
    job_id = os.environ.get('JOB_ID')
    model_id = os.environ.get('MODEL_ID')
    
    print(f"Starting inference for job {job_id} with model {model_id}")
    
    # Wait for input
    while True:
        if os.path.exists('/app/input.json'):
            with open('/app/input.json', 'r') as f:
                input_data = json.load(f)
            
            # Process input
            result = process_input(input_data, model_id)
            
            # Write output
            with open('/app/output.json', 'w') as f:
                json.dump(result, f)
            
            print(f"Inference completed for job {job_id}")
            break
        
        time.sleep(1)

def process_input(input_data, model_id):
    # Mock processing
    return {
        "result": f"Processed {input_data} with model {model_id}",
        "timestamp": time.time()
    }

if __name__ == "__main__":
    main()
"""
            
            # Create temporary directory
            with tempfile.TemporaryDirectory() as temp_dir:
                # Write Dockerfile
                with open(os.path.join(temp_dir, 'Dockerfile'), 'w') as f:
                    f.write(dockerfile)
                
                # Write inference script
                with open(os.path.join(temp_dir, 'inference.py'), 'w') as f:
                    f.write(inference_script)
                
                # Build image
                logger.info("Building Docker image localbase/inference:latest")
                self.client.images.build(
                    path=temp_dir,
                    tag="localbase/inference:latest",
                    rm=True
                )
            
            logger.info("Docker image localbase/inference:latest created")
            
        except Exception as e:
            logger.error(f"Failed to create Docker image: {e}")
            raise
