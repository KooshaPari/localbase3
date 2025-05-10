"""
Job Processor for LocalBase Provider Node
"""

import os
import json
import time
import logging
import threading
import uuid
import queue
from typing import Dict, Any, List, Optional, Callable, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

class JobProcessor:
    """
    Job processor for the provider node
    """
    
    def __init__(self, config: Dict[str, Any], security_manager=None):
        """
        Initialize the job processor
        
        Args:
            config: Job processor configuration
            security_manager: Security manager instance
        """
        self.config = config
        self.security_manager = security_manager
        self.job_dir = config.get("job_dir", "/var/lib/localbase/jobs")
        self.max_concurrent_jobs = config.get("max_concurrent_jobs", 10)
        self.job_timeout = config.get("job_timeout", 300)  # 5 minutes
        self.job_queue = queue.Queue()
        self.active_jobs = {}
        self.completed_jobs = {}
        self.job_lock = threading.Lock()
        self.worker_threads = []
        self.running = False
        self.job_handlers = {}
        
        # Create job directory if it doesn't exist
        os.makedirs(self.job_dir, exist_ok=True)
        
        logger.info("Job Processor initialized")
    
    def start(self):
        """
        Start the job processor
        """
        if self.running:
            logger.warning("Job processor already running")
            return
        
        logger.info("Starting job processor")
        
        self.running = True
        
        # Start worker threads
        self._start_workers()
        
        logger.info("Job processor started")
    
    def stop(self):
        """
        Stop the job processor
        """
        if not self.running:
            logger.warning("Job processor not running")
            return
        
        logger.info("Stopping job processor")
        
        self.running = False
        
        # Stop worker threads
        self._stop_workers()
        
        logger.info("Job processor stopped")
    
    def _start_workers(self):
        """
        Start worker threads
        """
        logger.info(f"Starting {self.max_concurrent_jobs} worker threads")
        
        for i in range(self.max_concurrent_jobs):
            thread = threading.Thread(target=self._worker_loop, args=(i,))
            thread.daemon = True
            thread.start()
            self.worker_threads.append(thread)
    
    def _stop_workers(self):
        """
        Stop worker threads
        """
        logger.info("Stopping worker threads")
        
        # Wait for threads to stop
        for thread in self.worker_threads:
            thread.join(timeout=5)
        
        self.worker_threads = []
    
    def _worker_loop(self, worker_id: int):
        """
        Worker thread loop
        
        Args:
            worker_id: Worker ID
        """
        logger.info(f"Worker {worker_id} started")
        
        while self.running:
            try:
                # Get job from queue with timeout
                try:
                    job = self.job_queue.get(timeout=1)
                except queue.Empty:
                    continue
                
                # Process job
                self._process_job(job, worker_id)
                
                # Mark job as done
                self.job_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error in worker {worker_id}: {e}")
        
        logger.info(f"Worker {worker_id} stopped")
    
    def _process_job(self, job: Dict[str, Any], worker_id: int):
        """
        Process a job
        
        Args:
            job: Job data
            worker_id: Worker ID
        """
        job_id = job["id"]
        logger.info(f"Worker {worker_id} processing job {job_id}")
        
        # Update job status
        self._update_job_status(job_id, "processing", {"worker_id": worker_id, "start_time": time.time()})
        
        try:
            # Create secure environment
            if self.security_manager:
                env_info = self.security_manager.create_secure_environment(job_id)
                if not env_info["valid"]:
                    raise Exception(f"Failed to create secure environment: {env_info['issues']}")
                
                job["sandbox_path"] = env_info["sandbox_path"]
            
            # Get job handler
            job_type = job.get("type", "default")
            handler = self.job_handlers.get(job_type)
            
            if not handler:
                raise Exception(f"No handler for job type: {job_type}")
            
            # Execute job
            result = handler(job)
            
            # Scan job output
            if self.security_manager and "output_path" in result:
                scan_results = self.security_manager.scan_job_output(job_id, result["output_path"])
                if not scan_results["valid"]:
                    raise Exception(f"Job output failed security scan: {scan_results['issues']}")
            
            # Update job status
            self._update_job_status(job_id, "completed", {
                "end_time": time.time(),
                "result": result,
            })
            
            logger.info(f"Job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {e}")
            
            # Update job status
            self._update_job_status(job_id, "failed", {
                "end_time": time.time(),
                "error": str(e),
            })
        
        finally:
            # Clean up secure environment
            if self.security_manager and "sandbox_path" in job:
                self.security_manager.cleanup_environment(job_id)
    
    def _update_job_status(self, job_id: str, status: str, data: Dict[str, Any] = None):
        """
        Update job status
        
        Args:
            job_id: Job ID
            status: New status
            data: Additional data
        """
        with self.job_lock:
            # Get job
            if status == "processing":
                job = self.active_jobs.get(job_id)
                if not job:
                    return
            elif status in ["completed", "failed"]:
                job = self.active_jobs.pop(job_id, None)
                if not job:
                    return
                self.completed_jobs[job_id] = job
            else:
                return
            
            # Update job status
            job["status"] = status
            
            # Update job data
            if data:
                job.update(data)
            
            # Save job to disk
            self._save_job(job)
    
    def _save_job(self, job: Dict[str, Any]):
        """
        Save job to disk
        
        Args:
            job: Job data
        """
        job_id = job["id"]
        job_file = os.path.join(self.job_dir, f"{job_id}.json")
        
        with open(job_file, "w") as f:
            json.dump(job, f, indent=2)
    
    def submit_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submit a job for processing
        
        Args:
            job_data: Job data
            
        Returns:
            Job information
        """
        # Generate job ID if not provided
        job_id = job_data.get("id", str(uuid.uuid4()))
        
        # Create job
        job = {
            "id": job_id,
            "type": job_data.get("type", "default"),
            "model": job_data.get("model"),
            "input": job_data.get("input", {}),
            "parameters": job_data.get("parameters", {}),
            "status": "pending",
            "created_at": time.time(),
            "updated_at": time.time(),
            "timeout": job_data.get("timeout", self.job_timeout),
        }
        
        logger.info(f"Submitting job: {job_id}")
        
        # Validate job
        if not self._validate_job(job):
            job["status"] = "rejected"
            job["error"] = "Invalid job data"
            return job
        
        # Add job to queue
        with self.job_lock:
            self.active_jobs[job_id] = job
            self._save_job(job)
        
        self.job_queue.put(job)
        
        logger.info(f"Job {job_id} submitted")
        
        return job
    
    def _validate_job(self, job: Dict[str, Any]) -> bool:
        """
        Validate job data
        
        Args:
            job: Job data
            
        Returns:
            Validation result
        """
        # Check if job has required fields
        if not job.get("model"):
            logger.error(f"Job {job['id']} missing required field: model")
            return False
        
        # Check if job type has a handler
        job_type = job.get("type", "default")
        if job_type not in self.job_handlers:
            logger.error(f"Job {job['id']} has unsupported type: {job_type}")
            return False
        
        return True
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get job information
        
        Args:
            job_id: Job ID
            
        Returns:
            Job information or None if not found
        """
        with self.job_lock:
            # Check active jobs
            if job_id in self.active_jobs:
                return self.active_jobs[job_id]
            
            # Check completed jobs
            if job_id in self.completed_jobs:
                return self.completed_jobs[job_id]
            
            # Check job file
            job_file = os.path.join(self.job_dir, f"{job_id}.json")
            if os.path.exists(job_file):
                try:
                    with open(job_file, "r") as f:
                        return json.load(f)
                except Exception as e:
                    logger.error(f"Error loading job file {job_file}: {e}")
            
            return None
    
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job
        
        Args:
            job_id: Job ID
            
        Returns:
            Success flag
        """
        logger.info(f"Cancelling job: {job_id}")
        
        with self.job_lock:
            # Check if job is active
            if job_id not in self.active_jobs:
                logger.warning(f"Job {job_id} not found or already completed")
                return False
            
            # Get job
            job = self.active_jobs[job_id]
            
            # Check if job is already processing
            if job["status"] == "processing":
                logger.warning(f"Job {job_id} is already processing, cannot cancel")
                return False
            
            # Remove job from active jobs
            del self.active_jobs[job_id]
            
            # Update job status
            job["status"] = "cancelled"
            job["updated_at"] = time.time()
            
            # Add to completed jobs
            self.completed_jobs[job_id] = job
            
            # Save job to disk
            self._save_job(job)
            
            logger.info(f"Job {job_id} cancelled")
            
            return True
    
    def register_job_handler(self, job_type: str, handler: Callable[[Dict[str, Any]], Dict[str, Any]]):
        """
        Register a job handler
        
        Args:
            job_type: Job type
            handler: Job handler function
        """
        self.job_handlers[job_type] = handler
        logger.info(f"Job handler registered for type: {job_type}")
    
    def get_queue_size(self) -> int:
        """
        Get job queue size
        
        Returns:
            Job queue size
        """
        return self.job_queue.qsize()
    
    def get_active_jobs(self) -> List[Dict[str, Any]]:
        """
        Get active jobs
        
        Returns:
            List of active jobs
        """
        with self.job_lock:
            return list(self.active_jobs.values())
    
    def get_completed_jobs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get completed jobs
        
        Args:
            limit: Maximum number of jobs to return
            
        Returns:
            List of completed jobs
        """
        with self.job_lock:
            jobs = list(self.completed_jobs.values())
            jobs.sort(key=lambda x: x.get("updated_at", 0), reverse=True)
            return jobs[:limit]
    
    def cleanup_old_jobs(self, max_age: int = 86400):
        """
        Clean up old completed jobs
        
        Args:
            max_age: Maximum age in seconds
        """
        logger.info(f"Cleaning up completed jobs older than {max_age} seconds")
        
        current_time = time.time()
        
        with self.job_lock:
            # Find old jobs
            old_jobs = []
            
            for job_id, job in self.completed_jobs.items():
                if current_time - job.get("updated_at", 0) > max_age:
                    old_jobs.append(job_id)
            
            # Remove old jobs
            for job_id in old_jobs:
                del self.completed_jobs[job_id]
                
                # Remove job file
                job_file = os.path.join(self.job_dir, f"{job_id}.json")
                if os.path.exists(job_file):
                    try:
                        os.remove(job_file)
                    except Exception as e:
                        logger.error(f"Error removing job file {job_file}: {e}")
            
            logger.info(f"Cleaned up {len(old_jobs)} old jobs")
