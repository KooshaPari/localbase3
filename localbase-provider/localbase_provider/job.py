"""
Job Manager for LocalBase Provider Node
"""

import os
import json
import time
import logging
import threading
import queue
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class JobManager:
    """
    Manages job execution
    """
    
    def __init__(self, config: Dict[str, Any], blockchain_client, container_manager, model_registry):
        """
        Initialize the job manager
        
        Args:
            config: Job configuration
            blockchain_client: Blockchain client instance
            container_manager: Container manager instance
            model_registry: Model registry instance
        """
        self.config = config
        self.blockchain_client = blockchain_client
        self.container_manager = container_manager
        self.model_registry = model_registry
        
        self.max_concurrent_jobs = config.get("max_concurrent_jobs", 4)
        self.poll_interval = config.get("poll_interval", 5)  # seconds
        self.timeout = config.get("timeout", 300)  # seconds
        
        self.running = False
        self.job_queue = queue.Queue()
        self.active_jobs = {}
        self.completed_jobs = {}
        self.failed_jobs = {}
        
        self.poll_thread = None
        self.worker_threads = []
        
        logger.info("Job Manager initialized")
    
    def start(self):
        """
        Start the job manager
        """
        if self.running:
            logger.warning("Job Manager already running")
            return
        
        logger.info("Starting Job Manager")
        self.running = True
        
        # Start polling thread
        self.poll_thread = threading.Thread(target=self._poll_jobs, daemon=True)
        self.poll_thread.start()
        
        # Start worker threads
        for i in range(self.max_concurrent_jobs):
            worker_thread = threading.Thread(target=self._process_jobs, daemon=True)
            worker_thread.start()
            self.worker_threads.append(worker_thread)
        
        logger.info(f"Job Manager started with {self.max_concurrent_jobs} workers")
    
    def stop(self):
        """
        Stop the job manager
        """
        if not self.running:
            logger.warning("Job Manager not running")
            return
        
        logger.info("Stopping Job Manager")
        self.running = False
        
        # Wait for threads to finish
        if self.poll_thread:
            self.poll_thread.join(timeout=10)
        
        for worker_thread in self.worker_threads:
            worker_thread.join(timeout=10)
        
        # Clear job queue
        while not self.job_queue.empty():
            try:
                self.job_queue.get_nowait()
            except queue.Empty:
                break
        
        # Stop active jobs
        for job_id in list(self.active_jobs.keys()):
            self._fail_job(job_id, "Job Manager stopped")
        
        logger.info("Job Manager stopped")
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get job manager status
        
        Returns:
            Status information
        """
        return {
            "running": self.running,
            "queue_size": self.job_queue.qsize(),
            "active_jobs": len(self.active_jobs),
            "completed_jobs": len(self.completed_jobs),
            "failed_jobs": len(self.failed_jobs),
            "max_concurrent_jobs": self.max_concurrent_jobs
        }
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get job information
        
        Args:
            job_id: Job ID
            
        Returns:
            Job information or None if not found
        """
        # Check active jobs
        if job_id in self.active_jobs:
            return self.active_jobs[job_id]
        
        # Check completed jobs
        if job_id in self.completed_jobs:
            return self.completed_jobs[job_id]
        
        # Check failed jobs
        if job_id in self.failed_jobs:
            return self.failed_jobs[job_id]
        
        return None
    
    def get_jobs(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get jobs
        
        Args:
            status: Job status filter
            
        Returns:
            List of jobs
        """
        jobs = []
        
        if status is None or status == "active":
            jobs.extend(self.active_jobs.values())
        
        if status is None or status == "completed":
            jobs.extend(self.completed_jobs.values())
        
        if status is None or status == "failed":
            jobs.extend(self.failed_jobs.values())
        
        # Sort by created_at
        jobs.sort(key=lambda j: j.get("created_at", 0), reverse=True)
        
        return jobs
    
    def _poll_jobs(self):
        """
        Poll for new jobs from the blockchain
        """
        while self.running:
            try:
                # Get provider ID
                provider_id = self.blockchain_client.get_provider_id()
                
                if not provider_id:
                    logger.warning("Provider not registered, skipping job poll")
                    time.sleep(self.poll_interval)
                    continue
                
                # Get pending jobs
                pending_jobs = self.blockchain_client.get_pending_jobs(provider_id)
                
                for job in pending_jobs:
                    job_id = job["id"]
                    
                    # Skip if already in queue or active
                    if job_id in self.active_jobs or self._is_job_in_queue(job_id):
                        continue
                    
                    # Skip if already completed or failed
                    if job_id in self.completed_jobs or job_id in self.failed_jobs:
                        continue
                    
                    logger.info(f"New job found: {job_id}")
                    
                    # Add to queue
                    self.job_queue.put(job)
                
                # Sleep before next poll
                time.sleep(self.poll_interval)
                
            except Exception as e:
                logger.error(f"Error polling jobs: {e}")
                time.sleep(self.poll_interval)
    
    def _process_jobs(self):
        """
        Process jobs from the queue
        """
        while self.running:
            try:
                # Get job from queue
                job = self.job_queue.get(timeout=1)
                
                # Process job
                self._process_job(job)
                
                # Mark as done
                self.job_queue.task_done()
                
            except queue.Empty:
                # No jobs in queue
                pass
            except Exception as e:
                logger.error(f"Error processing job: {e}")
    
    def _process_job(self, job: Dict[str, Any]):
        """
        Process a job
        
        Args:
            job: Job data
        """
        job_id = job["id"]
        model_id = job["model"]
        
        logger.info(f"Processing job {job_id} with model {model_id}")
        
        try:
            # Start job on blockchain
            self.blockchain_client.start_job(job_id)
            
            # Add to active jobs
            self.active_jobs[job_id] = {
                "id": job_id,
                "model": model_id,
                "creator": job["creator"],
                "input": job["input"],
                "parameters": job.get("parameters", {}),
                "status": "processing",
                "created_at": job.get("created_at", time.time()),
                "started_at": time.time()
            }
            
            # Load model
            if not self.model_registry.load_model(model_id):
                raise Exception(f"Failed to load model {model_id}")
            
            model_instance = self.model_registry.get_model_instance(model_id)
            
            if not model_instance:
                raise Exception(f"Failed to get model instance for {model_id}")
            
            # Allocate resources
            resources = self.hardware_manager.allocate_resources(model_id)
            
            # Create container
            container_id = self.container_manager.create_container(job_id, model_id, resources)
            
            if not container_id:
                raise Exception("Failed to create container")
            
            # Prepare input
            input_data = job["input"]
            parameters = job.get("parameters", {})
            
            # Run inference
            result, usage = self._run_inference(job_id, model_id, model_instance, input_data, parameters)
            
            # Complete job
            self._complete_job(job_id, result, usage)
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {e}")
            self._fail_job(job_id, str(e))
        finally:
            # Unload model
            self.model_registry.unload_model(model_id)
            
            # Stop container
            self.container_manager.stop_container(job_id)
    
    def _run_inference(self, job_id: str, model_id: str, model_instance: Any, input_data: Any, parameters: Dict[str, Any]) -> tuple:
        """
        Run inference
        
        Args:
            job_id: Job ID
            model_id: Model ID
            model_instance: Model instance
            input_data: Input data
            parameters: Parameters
            
        Returns:
            Tuple of (result, usage)
        """
        logger.info(f"Running inference for job {job_id}")
        
        try:
            # Process based on model type
            if model_id.startswith("lb-llama") or model_id.startswith("lb-mixtral"):
                return self._run_llm_inference(model_instance, input_data, parameters)
            elif model_id.startswith("lb-embedding"):
                return self._run_embedding_inference(model_instance, input_data, parameters)
            else:
                return self._run_generic_inference(model_instance, input_data, parameters)
        except Exception as e:
            logger.error(f"Error running inference: {e}")
            raise
    
    def _run_llm_inference(self, model_instance: Any, input_data: Any, parameters: Dict[str, Any]) -> tuple:
        """
        Run LLM inference
        
        Args:
            model_instance: Model instance
            input_data: Input data
            parameters: Parameters
            
        Returns:
            Tuple of (result, usage)
        """
        # Extract parameters
        max_tokens = parameters.get("max_tokens", 100)
        temperature = parameters.get("temperature", 0.7)
        top_p = parameters.get("top_p", 1.0)
        
        # Process input
        prompt = input_data
        
        # Run inference
        start_time = time.time()
        
        if hasattr(model_instance, "generate"):
            output = model_instance.generate(prompt, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
            result = output
        elif hasattr(model_instance, "create_completion"):
            output = model_instance.create_completion(prompt, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
            result = output
        else:
            # Fallback for llama_cpp
            output = model_instance(prompt, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
            result = output['choices'][0]['text']
        
        end_time = time.time()
        
        # Calculate usage
        input_tokens = len(prompt.split())
        output_tokens = len(result.split())
        
        usage = {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "inference_time": end_time - start_time
        }
        
        return result, usage
    
    def _run_embedding_inference(self, model_instance: Any, input_data: Any, parameters: Dict[str, Any]) -> tuple:
        """
        Run embedding inference
        
        Args:
            model_instance: Model instance
            input_data: Input data
            parameters: Parameters
            
        Returns:
            Tuple of (result, usage)
        """
        # Process input
        text = input_data
        
        # Run inference
        start_time = time.time()
        
        if isinstance(model_instance, dict) and "model" in model_instance and "tokenizer" in model_instance:
            # Transformers model
            tokenizer = model_instance["tokenizer"]
            model = model_instance["model"]
            
            inputs = tokenizer(text, return_tensors="pt")
            if next(model.parameters()).is_cuda:
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = model(**inputs)
            
            # Get embeddings
            embeddings = outputs.last_hidden_state.mean(dim=1).cpu().numpy().tolist()[0]
            result = embeddings
        else:
            # Generic model
            embeddings = model_instance.embed(text)
            result = embeddings
        
        end_time = time.time()
        
        # Calculate usage
        input_tokens = len(text.split())
        
        usage = {
            "input_tokens": input_tokens,
            "output_tokens": 0,
            "total_tokens": input_tokens,
            "inference_time": end_time - start_time
        }
        
        return result, usage
    
    def _run_generic_inference(self, model_instance: Any, input_data: Any, parameters: Dict[str, Any]) -> tuple:
        """
        Run generic inference
        
        Args:
            model_instance: Model instance
            input_data: Input data
            parameters: Parameters
            
        Returns:
            Tuple of (result, usage)
        """
        # Run inference
        start_time = time.time()
        
        if hasattr(model_instance, "generate"):
            result = model_instance.generate(input_data, **parameters)
        elif hasattr(model_instance, "create_completion"):
            result = model_instance.create_completion(input_data, **parameters)
        elif hasattr(model_instance, "embed"):
            result = model_instance.embed(input_data)
        elif hasattr(model_instance, "__call__"):
            result = model_instance(input_data, **parameters)
        else:
            raise Exception("Unknown model interface")
        
        end_time = time.time()
        
        # Calculate usage
        input_tokens = len(str(input_data).split())
        output_tokens = len(str(result).split()) if result else 0
        
        usage = {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "inference_time": end_time - start_time
        }
        
        return result, usage
    
    def _complete_job(self, job_id: str, result: Any, usage: Dict[str, Any]):
        """
        Complete a job
        
        Args:
            job_id: Job ID
            result: Job result
            usage: Token usage
        """
        logger.info(f"Completing job {job_id}")
        
        try:
            # Update job status
            if job_id in self.active_jobs:
                job = self.active_jobs[job_id]
                job["status"] = "completed"
                job["result"] = result
                job["usage"] = usage
                job["completed_at"] = time.time()
                
                # Move to completed jobs
                self.completed_jobs[job_id] = job
                del self.active_jobs[job_id]
            
            # Complete job on blockchain
            self.blockchain_client.complete_job(job_id, json.dumps(result), usage)
            
            logger.info(f"Job {job_id} completed")
            
        except Exception as e:
            logger.error(f"Error completing job {job_id}: {e}")
            self._fail_job(job_id, str(e))
    
    def _fail_job(self, job_id: str, error: str):
        """
        Fail a job
        
        Args:
            job_id: Job ID
            error: Error message
        """
        logger.info(f"Failing job {job_id}: {error}")
        
        try:
            # Update job status
            if job_id in self.active_jobs:
                job = self.active_jobs[job_id]
                job["status"] = "failed"
                job["error"] = error
                job["failed_at"] = time.time()
                
                # Move to failed jobs
                self.failed_jobs[job_id] = job
                del self.active_jobs[job_id]
            
            # Fail job on blockchain
            self.blockchain_client.fail_job(job_id, error)
            
            logger.info(f"Job {job_id} failed")
            
        except Exception as e:
            logger.error(f"Error failing job {job_id}: {e}")
    
    def _is_job_in_queue(self, job_id: str) -> bool:
        """
        Check if a job is in the queue
        
        Args:
            job_id: Job ID
            
        Returns:
            True if job is in queue, False otherwise
        """
        # Check queue
        for item in list(self.job_queue.queue):
            if item["id"] == job_id:
                return True
        
        return False
