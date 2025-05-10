"""
API Server for LocalBase Provider Node
"""

import os
import json
import time
import logging
import threading
import uuid
from typing import Dict, Any, List, Optional, Callable, Tuple
from datetime import datetime

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# API Models
class JobRequest(BaseModel):
    """Job request model"""
    model: str = Field(..., description="Model ID")
    input: Dict[str, Any] = Field(default={}, description="Input data")
    parameters: Dict[str, Any] = Field(default={}, description="Model parameters")
    type: str = Field(default="default", description="Job type")
    timeout: Optional[int] = Field(default=None, description="Job timeout in seconds")

class JobResponse(BaseModel):
    """Job response model"""
    id: str = Field(..., description="Job ID")
    status: str = Field(..., description="Job status")
    created_at: float = Field(..., description="Creation timestamp")
    updated_at: float = Field(..., description="Last update timestamp")
    model: str = Field(..., description="Model ID")
    type: str = Field(..., description="Job type")
    input: Dict[str, Any] = Field(default={}, description="Input data")
    parameters: Dict[str, Any] = Field(default={}, description="Model parameters")
    result: Optional[Dict[str, Any]] = Field(default=None, description="Job result")
    error: Optional[str] = Field(default=None, description="Error message")

class ModelInfo(BaseModel):
    """Model information model"""
    id: str = Field(..., description="Model ID")
    name: str = Field(..., description="Model name")
    description: str = Field(default="", description="Model description")
    version: str = Field(default="1.0.0", description="Model version")
    type: str = Field(default="unknown", description="Model type")
    loaded: bool = Field(default=False, description="Whether the model is loaded")
    capabilities: List[str] = Field(default=[], description="Model capabilities")
    parameters: Dict[str, Any] = Field(default={}, description="Model parameters")

class StatusResponse(BaseModel):
    """Status response model"""
    node_id: str = Field(..., description="Node ID")
    provider_name: str = Field(..., description="Provider name")
    provider_description: str = Field(..., description="Provider description")
    provider_endpoint: str = Field(..., description="Provider endpoint")
    provider_status: str = Field(..., description="Provider status")
    uptime: float = Field(..., description="Uptime in seconds")
    start_time: float = Field(..., description="Start timestamp")
    job_queue_size: int = Field(..., description="Job queue size")
    active_jobs: int = Field(..., description="Number of active jobs")
    completed_jobs: int = Field(..., description="Number of completed jobs")
    available_models: List[str] = Field(..., description="Available models")
    loaded_models: List[str] = Field(..., description="Loaded models")

class MetricsResponse(BaseModel):
    """Metrics response model"""
    system: Dict[str, Any] = Field(..., description="System metrics")
    gpu: Dict[str, Any] = Field(..., description="GPU metrics")
    jobs: Dict[str, Any] = Field(..., description="Job metrics")
    models: Dict[str, Any] = Field(..., description="Model metrics")
    blockchain: Dict[str, Any] = Field(..., description="Blockchain metrics")
    timestamp: float = Field(..., description="Timestamp")

class APIServer:
    """
    API Server for the provider node
    """
    
    def __init__(self, config: Dict[str, Any], provider_node=None):
        """
        Initialize the API server
        
        Args:
            config: API server configuration
            provider_node: Provider node instance
        """
        self.config = config
        self.provider_node = provider_node
        self.host = config.get("host", "0.0.0.0")
        self.port = config.get("port", 8000)
        self.debug = config.get("debug", False)
        self.api_keys = config.get("api_keys", [])
        self.enable_cors = config.get("enable_cors", True)
        self.cors_origins = config.get("cors_origins", ["*"])
        self.app = FastAPI(
            title="LocalBase Provider API",
            description="API for LocalBase Provider Node",
            version="1.0.0",
        )
        self.server = None
        self.server_thread = None
        self.running = False
        
        # Set up routes
        self._setup_routes()
        
        # Set up middleware
        self._setup_middleware()
        
        logger.info("API Server initialized")
    
    def _setup_routes(self):
        """
        Set up API routes
        """
        # Health check
        @self.app.get("/health", tags=["Health"])
        async def health_check():
            return {"status": "ok"}
        
        # Status
        @self.app.get("/status", response_model=StatusResponse, tags=["Status"])
        async def get_status():
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            return self.provider_node.get_status()
        
        # Metrics
        @self.app.get("/metrics", response_model=MetricsResponse, tags=["Status"])
        async def get_metrics():
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            return self.provider_node.get_metrics()
        
        # Models
        @self.app.get("/models", response_model=List[ModelInfo], tags=["Models"])
        async def get_models():
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            return self.provider_node.get_models()
        
        @self.app.get("/models/{model_id}", response_model=ModelInfo, tags=["Models"])
        async def get_model(model_id: str):
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            models = self.provider_node.get_models()
            
            for model in models:
                if model["id"] == model_id:
                    return model
            
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
        
        @self.app.post("/models/{model_id}/load", tags=["Models"])
        async def load_model(model_id: str):
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            success = self.provider_node.load_model(model_id)
            
            if not success:
                raise HTTPException(status_code=500, detail=f"Failed to load model {model_id}")
            
            return {"status": "ok", "message": f"Model {model_id} loaded"}
        
        @self.app.post("/models/{model_id}/unload", tags=["Models"])
        async def unload_model(model_id: str):
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            success = self.provider_node.unload_model(model_id)
            
            if not success:
                raise HTTPException(status_code=500, detail=f"Failed to unload model {model_id}")
            
            return {"status": "ok", "message": f"Model {model_id} unloaded"}
        
        # Jobs
        @self.app.post("/jobs", response_model=JobResponse, tags=["Jobs"])
        async def create_job(job_request: JobRequest):
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            job = self.provider_node.job_processor.submit_job(job_request.dict())
            
            if job["status"] == "rejected":
                raise HTTPException(status_code=400, detail=job.get("error", "Job rejected"))
            
            return job
        
        @self.app.get("/jobs/{job_id}", response_model=JobResponse, tags=["Jobs"])
        async def get_job(job_id: str):
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            job = self.provider_node.job_processor.get_job(job_id)
            
            if not job:
                raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
            
            return job
        
        @self.app.post("/jobs/{job_id}/cancel", tags=["Jobs"])
        async def cancel_job(job_id: str):
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            success = self.provider_node.job_processor.cancel_job(job_id)
            
            if not success:
                raise HTTPException(status_code=400, detail=f"Failed to cancel job {job_id}")
            
            return {"status": "ok", "message": f"Job {job_id} cancelled"}
        
        @self.app.get("/jobs", response_model=List[JobResponse], tags=["Jobs"])
        async def list_jobs(status: Optional[str] = None, limit: int = 100):
            if not self.provider_node:
                raise HTTPException(status_code=503, detail="Provider node not available")
            
            if status == "active":
                jobs = self.provider_node.job_processor.get_active_jobs()
            elif status == "completed":
                jobs = self.provider_node.job_processor.get_completed_jobs(limit)
            else:
                active_jobs = self.provider_node.job_processor.get_active_jobs()
                completed_jobs = self.provider_node.job_processor.get_completed_jobs(limit)
                jobs = active_jobs + completed_jobs
                jobs.sort(key=lambda x: x.get("updated_at", 0), reverse=True)
                jobs = jobs[:limit]
            
            return jobs
    
    def _setup_middleware(self):
        """
        Set up API middleware
        """
        # CORS middleware
        if self.enable_cors:
            self.app.add_middleware(
                CORSMiddleware,
                allow_origins=self.cors_origins,
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )
        
        # API key middleware
        @self.app.middleware("http")
        async def api_key_middleware(request: Request, call_next):
            # Skip API key check for health check
            if request.url.path == "/health":
                return await call_next(request)
            
            # Check API key
            if self.api_keys:
                api_key = request.headers.get("X-API-Key")
                
                if not api_key or api_key not in self.api_keys:
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={"detail": "Invalid API key"},
                    )
            
            return await call_next(request)
    
    def start(self):
        """
        Start the API server
        """
        if self.running:
            logger.warning("API server already running")
            return
        
        logger.info(f"Starting API server on {self.host}:{self.port}")
        
        self.running = True
        
        # Start server in a separate thread
        self.server_thread = threading.Thread(target=self._run_server)
        self.server_thread.daemon = True
        self.server_thread.start()
        
        logger.info("API server started")
    
    def stop(self):
        """
        Stop the API server
        """
        if not self.running:
            logger.warning("API server not running")
            return
        
        logger.info("Stopping API server")
        
        self.running = False
        
        # Stop server
        if self.server:
            self.server.should_exit = True
        
        # Wait for thread to stop
        if self.server_thread:
            self.server_thread.join(timeout=5)
        
        logger.info("API server stopped")
    
    def _run_server(self):
        """
        Run the API server
        """
        config = uvicorn.Config(
            app=self.app,
            host=self.host,
            port=self.port,
            log_level="info" if self.debug else "error",
            loop="asyncio",
        )
        
        self.server = uvicorn.Server(config)
        self.server.run()
    
    def add_api_key(self, api_key: str):
        """
        Add an API key
        
        Args:
            api_key: API key
        """
        if api_key not in self.api_keys:
            self.api_keys.append(api_key)
            logger.info(f"API key added: {api_key[:8]}...")
    
    def remove_api_key(self, api_key: str):
        """
        Remove an API key
        
        Args:
            api_key: API key
        """
        if api_key in self.api_keys:
            self.api_keys.remove(api_key)
            logger.info(f"API key removed: {api_key[:8]}...")
    
    def get_api_keys(self) -> List[str]:
        """
        Get API keys
        
        Returns:
            List of API keys
        """
        return self.api_keys
