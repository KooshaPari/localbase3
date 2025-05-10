"""
Model Registry for LocalBase Provider Node
"""

import os
import json
import logging
import hashlib
import shutil
import requests
from typing import Dict, Any, List, Optional
from pathlib import Path
import huggingface_hub

logger = logging.getLogger(__name__)

class ModelRegistry:
    """
    Manages AI models for the provider node
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the model registry
        
        Args:
            config: Model configuration
        """
        self.config = config
        self.models_dir = Path(os.environ.get("MODELS_DIR", "models"))
        self.models_dir.mkdir(exist_ok=True)
        
        self.models = {}
        self.model_formats = {
            "gguf": self._load_gguf_model,
            "onnx": self._load_onnx_model,
            "pytorch": self._load_pytorch_model,
            "safetensors": self._load_safetensors_model
        }
        
        logger.info("Model Registry initialized")
    
    def initialize(self):
        """
        Initialize the model registry
        """
        logger.info("Initializing Model Registry")
        
        # Load model configurations
        for model_config in self.config:
            model_id = model_config["id"]
            model_path = model_config.get("path")
            model_format = model_config.get("format", "gguf")
            
            # Check if model exists
            if model_path and os.path.exists(model_path):
                logger.info(f"Model {model_id} found at {model_path}")
                self.models[model_id] = {
                    "id": model_id,
                    "path": model_path,
                    "format": model_format,
                    "loaded": False,
                    "instance": None
                }
            else:
                logger.info(f"Model {model_id} not found, will download")
                self.models[model_id] = {
                    "id": model_id,
                    "path": str(self.models_dir / model_id),
                    "format": model_format,
                    "loaded": False,
                    "instance": None
                }
        
        # Download missing models
        for model_id, model in self.models.items():
            if not os.path.exists(model["path"]):
                self._download_model(model_id)
        
        logger.info(f"Model Registry initialized with {len(self.models)} models")
    
    def get_model_ids(self) -> List[str]:
        """
        Get list of available model IDs
        
        Returns:
            List of model IDs
        """
        return list(self.models.keys())
    
    def get_model_info(self, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a model
        
        Args:
            model_id: Model ID
            
        Returns:
            Model information or None if not found
        """
        if model_id not in self.models:
            return None
        
        model = self.models[model_id]
        return {
            "id": model_id,
            "path": model["path"],
            "format": model["format"],
            "loaded": model["loaded"]
        }
    
    def load_model(self, model_id: str) -> bool:
        """
        Load a model into memory
        
        Args:
            model_id: Model ID
            
        Returns:
            Success flag
        """
        if model_id not in self.models:
            logger.error(f"Model {model_id} not found")
            return False
        
        model = self.models[model_id]
        
        if model["loaded"]:
            logger.info(f"Model {model_id} already loaded")
            return True
        
        logger.info(f"Loading model {model_id}")
        
        try:
            # Get loader for model format
            loader = self.model_formats.get(model["format"])
            
            if not loader:
                logger.error(f"Unsupported model format: {model['format']}")
                return False
            
            # Load model
            model_instance = loader(model["path"])
            
            if not model_instance:
                logger.error(f"Failed to load model {model_id}")
                return False
            
            # Update model info
            model["loaded"] = True
            model["instance"] = model_instance
            
            logger.info(f"Model {model_id} loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model {model_id}: {e}")
            return False
    
    def unload_model(self, model_id: str) -> bool:
        """
        Unload a model from memory
        
        Args:
            model_id: Model ID
            
        Returns:
            Success flag
        """
        if model_id not in self.models:
            logger.error(f"Model {model_id} not found")
            return False
        
        model = self.models[model_id]
        
        if not model["loaded"]:
            logger.info(f"Model {model_id} not loaded")
            return True
        
        logger.info(f"Unloading model {model_id}")
        
        try:
            # Clear model instance
            model["loaded"] = False
            model["instance"] = None
            
            # Force garbage collection
            import gc
            gc.collect()
            
            logger.info(f"Model {model_id} unloaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error unloading model {model_id}: {e}")
            return False
    
    def get_model_instance(self, model_id: str) -> Optional[Any]:
        """
        Get a loaded model instance
        
        Args:
            model_id: Model ID
            
        Returns:
            Model instance or None if not loaded
        """
        if model_id not in self.models:
            logger.error(f"Model {model_id} not found")
            return None
        
        model = self.models[model_id]
        
        if not model["loaded"]:
            logger.warning(f"Model {model_id} not loaded, loading now")
            if not self.load_model(model_id):
                return None
        
        return model["instance"]
    
    def _download_model(self, model_id: str) -> bool:
        """
        Download a model
        
        Args:
            model_id: Model ID
            
        Returns:
            Success flag
        """
        if model_id not in self.models:
            logger.error(f"Model {model_id} not found in registry")
            return False
        
        model = self.models[model_id]
        model_path = model["path"]
        
        logger.info(f"Downloading model {model_id} to {model_path}")
        
        try:
            # Create directory
            os.makedirs(model_path, exist_ok=True)
            
            # Download from Hugging Face
            if model_id.startswith("lb-"):
                # Convert LocalBase model ID to Hugging Face repo ID
                hf_model_id = model_id.replace("lb-", "localbase/")
                
                logger.info(f"Downloading from Hugging Face: {hf_model_id}")
                
                huggingface_hub.snapshot_download(
                    repo_id=hf_model_id,
                    local_dir=model_path,
                    local_dir_use_symlinks=False
                )
            else:
                # Assume direct URL
                logger.info(f"Downloading from URL: {model_id}")
                
                response = requests.get(model_id, stream=True)
                response.raise_for_status()
                
                # Get filename from URL
                filename = os.path.basename(model_id)
                file_path = os.path.join(model_path, filename)
                
                # Save file
                with open(file_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
            
            logger.info(f"Model {model_id} downloaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error downloading model {model_id}: {e}")
            
            # Clean up
            if os.path.exists(model_path):
                shutil.rmtree(model_path)
                
            return False
    
    def _load_gguf_model(self, model_path: str) -> Optional[Any]:
        """
        Load a GGUF model
        
        Args:
            model_path: Path to model
            
        Returns:
            Model instance or None if failed
        """
        try:
            # Find model file
            if os.path.isdir(model_path):
                model_files = [f for f in os.listdir(model_path) if f.endswith(".gguf")]
                if not model_files:
                    logger.error(f"No GGUF files found in {model_path}")
                    return None
                model_file = os.path.join(model_path, model_files[0])
            else:
                model_file = model_path
            
            logger.info(f"Loading GGUF model from {model_file}")
            
            # Import llama_cpp
            try:
                from llama_cpp import Llama
            except ImportError:
                logger.error("llama_cpp not installed, cannot load GGUF model")
                return None
            
            # Load model
            model = Llama(
                model_path=model_file,
                n_ctx=2048,
                n_batch=512
            )
            
            return model
            
        except Exception as e:
            logger.error(f"Error loading GGUF model: {e}")
            return None
    
    def _load_onnx_model(self, model_path: str) -> Optional[Any]:
        """
        Load an ONNX model
        
        Args:
            model_path: Path to model
            
        Returns:
            Model instance or None if failed
        """
        try:
            # Import onnxruntime
            try:
                import onnxruntime as ort
            except ImportError:
                logger.error("onnxruntime not installed, cannot load ONNX model")
                return None
            
            # Find model file
            if os.path.isdir(model_path):
                model_files = [f for f in os.listdir(model_path) if f.endswith(".onnx")]
                if not model_files:
                    logger.error(f"No ONNX files found in {model_path}")
                    return None
                model_file = os.path.join(model_path, model_files[0])
            else:
                model_file = model_path
            
            logger.info(f"Loading ONNX model from {model_file}")
            
            # Check if GPU is available
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] if ort.get_device() == 'GPU' else ['CPUExecutionProvider']
            
            # Create session
            session = ort.InferenceSession(model_file, providers=providers)
            
            return session
            
        except Exception as e:
            logger.error(f"Error loading ONNX model: {e}")
            return None
    
    def _load_pytorch_model(self, model_path: str) -> Optional[Any]:
        """
        Load a PyTorch model
        
        Args:
            model_path: Path to model
            
        Returns:
            Model instance or None if failed
        """
        try:
            # Import torch
            try:
                import torch
                from transformers import AutoModel, AutoTokenizer
            except ImportError:
                logger.error("torch or transformers not installed, cannot load PyTorch model")
                return None
            
            logger.info(f"Loading PyTorch model from {model_path}")
            
            # Load model and tokenizer
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModel.from_pretrained(model_path)
            
            # Move to GPU if available
            if torch.cuda.is_available():
                model = model.to("cuda")
            
            return {
                "model": model,
                "tokenizer": tokenizer
            }
            
        except Exception as e:
            logger.error(f"Error loading PyTorch model: {e}")
            return None
    
    def _load_safetensors_model(self, model_path: str) -> Optional[Any]:
        """
        Load a SafeTensors model
        
        Args:
            model_path: Path to model
            
        Returns:
            Model instance or None if failed
        """
        try:
            # Import torch and safetensors
            try:
                import torch
                from transformers import AutoModel, AutoTokenizer
            except ImportError:
                logger.error("torch or transformers not installed, cannot load SafeTensors model")
                return None
            
            logger.info(f"Loading SafeTensors model from {model_path}")
            
            # Load model and tokenizer
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModel.from_pretrained(model_path)
            
            # Move to GPU if available
            if torch.cuda.is_available():
                model = model.to("cuda")
            
            return {
                "model": model,
                "tokenizer": tokenizer
            }
            
        except Exception as e:
            logger.error(f"Error loading SafeTensors model: {e}")
            return None
