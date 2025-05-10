"""
API Server for LocalBase Provider Node
"""

import os
import json
import logging
import threading
import uvicorn
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# API models
class JobRequest(BaseModel):
    model: str
    input: Any
    parameters: Dict[str, Any] = Field(default_factory=dict)

class JobResponse(BaseModel):
    id: str
    model: str
    status: str
    created_at: float
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    failed_at: Optional[float] = None
    result: Optional[Any] = None
    usage: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class StatusResponse(BaseModel):
    status: str
    version: str
    uptime: float
    hardware: Dict[str, Any]
    models: List[str]
    job_queue: int
    active_jobs: int
    completed_jobs: int
    failed_jobs: int

class ModelResponse(BaseModel):
    id: str
    path: str
    format: str
    loaded: bool

# Create FastAPI app
app = FastAPI(
    title="LocalBase Provider API",
    description="API for LocalBase Provider Node",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global job manager reference
job_manager = None

# API routes
@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {"message": "LocalBase Provider API"}

@app.get("/status", response_model=StatusResponse)
async def get_status():
    """
    Get provider status
    """
    if not job_manager:
        raise HTTPException(status_code=503, detail="Job manager not initialized")
    
    # Get status
    job_status = job_manager.get_status()
    
    # Get hardware info
    hardware_info = job_manager.hardware_manager.get_hardware_info()
    
    # Get model IDs
    model_ids = job_manager.model_registry.get_model_ids()
    
    # Calculate uptime
    import time
    start_time = getattr(app, "start_time", time.time())
    uptime = time.time() - start_time
    
    return {
        "status": "running" if job_status["running"] else "stopped",
        "version": "0.1.0",
        "uptime": uptime,
        "hardware": hardware_info,
        "models": model_ids,
        "job_queue": job_status["queue_size"],
        "active_jobs": job_status["active_jobs"],
        "completed_jobs": job_status["completed_jobs"],
        "failed_jobs": job_status["failed_jobs"]
    }

@app.get("/models")
async def get_models():
    """
    Get available models
    """
    if not job_manager:
        raise HTTPException(status_code=503, detail="Job manager not initialized")
    
    # Get model IDs
    model_ids = job_manager.model_registry.get_model_ids()
    
    # Get model info
    models = []
    for model_id in model_ids:
        model_info = job_manager.model_registry.get_model_info(model_id)
        if model_info:
            models.append(model_info)
    
    return models

@app.get("/models/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str):
    """
    Get model information
    """
    if not job_manager:
        raise HTTPException(status_code=503, detail="Job manager not initialized")
    
    # Get model info
    model_info = job_manager.model_registry.get_model_info(model_id)
    
    if not model_info:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    return model_info

@app.get("/jobs")
async def get_jobs(status: Optional[str] = None):
    """
    Get jobs
    """
    if not job_manager:
        raise HTTPException(status_code=503, detail="Job manager not initialized")
    
    # Validate status
    if status and status not in ["active", "completed", "failed"]:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    # Get jobs
    jobs = job_manager.get_jobs(status)
    
    return jobs

@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """
    Get job information
    """
    if not job_manager:
        raise HTTPException(status_code=503, detail="Job manager not initialized")
    
    # Get job
    job = job_manager.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    return job

@app.post("/jobs", response_model=JobResponse)
async def create_job(job_request: JobRequest):
    """
    Create a new job
    """
    if not job_manager:
        raise HTTPException(status_code=503, detail="Job manager not initialized")
    
    # Validate model
    model_id = job_request.model
    model_info = job_manager.model_registry.get_model_info(model_id)
    
    if not model_info:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    # Create job
    try:
        # Get provider ID
        provider_id = job_manager.blockchain_client.get_provider_id()
        
        if not provider_id:
            raise HTTPException(status_code=503, detail="Provider not registered")
        
        # Create job on blockchain
        job = job_manager.blockchain_client.create_job({
            "user": "api_user",  # In a real implementation, this would be the authenticated user
            "provider_id": provider_id,
            "model": model_id,
            "input": job_request.input,
            "parameters": job_request.parameters
        })
        
        # Add to queue
        job_manager.job_queue.put(job)
        
        return {
            "id": job["id"],
            "model": model_id,
            "status": "pending",
            "created_at": job.get("created_at", time.time())
        }
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """
    Cancel a job
    """
    if not job_manager:
        raise HTTPException(status_code=503, detail="Job manager not initialized")
    
    # Get job
    job = job_manager.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    # Check if job is active
    if job["status"] != "pending" and job["status"] != "processing":
        raise HTTPException(status_code=400, detail=f"Job {job_id} is not active")
    
    # Cancel job
    try:
        job_manager._fail_job(job_id, "Job cancelled by user")
        return {"message": f"Job {job_id} cancelled"}
    except Exception as e:
        logger.error(f"Error cancelling job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/benchmark")
async def get_benchmark():
    """
    Get benchmark results
    """
    if not job_manager:
        raise HTTPException(status_code=503, detail="Job manager not initialized")
    
    # Get benchmark results
    try:
        from localbase_provider.benchmark import BenchmarkEngine
        benchmark_engine = BenchmarkEngine(
            job_manager.hardware_manager,
            job_manager.container_manager,
            job_manager.model_registry
        )
        
        results = benchmark_engine.get_results()
        
        return results
    except Exception as e:
        logger.error(f"Error getting benchmark results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/benchmark")
async def run_benchmark():
    """
    Run benchmarks
    """
    if not job_manager:
        raise HTTPException(status_code=503, detail="Job manager not initialized")
    
    # Run benchmarks
    try:
        from localbase_provider.benchmark import BenchmarkEngine
        benchmark_engine = BenchmarkEngine(
            job_manager.hardware_manager,
            job_manager.container_manager,
            job_manager.model_registry
        )
        
        # Run in a separate thread
        def run_benchmark_thread():
            try:
                results = benchmark_engine.run_benchmarks()
                logger.info(f"Benchmark completed: {results}")
            except Exception as e:
                logger.error(f"Error running benchmark: {e}")
        
        thread = threading.Thread(target=run_benchmark_thread)
        thread.daemon = True
        thread.start()
        
        return {"message": "Benchmark started"}
    except Exception as e:
        logger.error(f"Error starting benchmark: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def start_api_server(config, job_manager_instance):
    """
    Start the API server
    
    Args:
        config: API configuration
        job_manager_instance: Job manager instance
    """
    global job_manager
    job_manager = job_manager_instance
    
    # Set start time
    import time
    app.start_time = time.time()
    
    # Get configuration
    host = config.get("host", "0.0.0.0")
    port = config.get("port", 8080)
    log_level = config.get("log_level", "info")
    
    # Start server
    uvicorn.run(app, host=host, port=port, log_level=log_level)
