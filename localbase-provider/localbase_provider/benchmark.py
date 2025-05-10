"""
Benchmarking Engine for LocalBase Provider Node
"""

import os
import json
import time
import logging
import numpy as np
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class BenchmarkEngine:
    """
    Benchmarking engine for standardized performance metrics
    """
    
    def __init__(self, hardware_manager, container_manager, model_registry):
        """
        Initialize the benchmarking engine
        
        Args:
            hardware_manager: Hardware manager instance
            container_manager: Container manager instance
            model_registry: Model registry instance
        """
        self.hardware_manager = hardware_manager
        self.container_manager = container_manager
        self.model_registry = model_registry
        
        self.results_file = Path("benchmark_results.json")
        self.results = {}
        
        # Load previous results if available
        if self.results_file.exists():
            try:
                with open(self.results_file, 'r') as f:
                    self.results = json.load(f)
                logger.info(f"Loaded benchmark results from {self.results_file}")
            except Exception as e:
                logger.error(f"Error loading benchmark results: {e}")
        
        logger.info("Benchmarking Engine initialized")
    
    def run_benchmarks(self) -> Dict[str, Any]:
        """
        Run benchmarks for all supported models
        
        Returns:
            Benchmark results
        """
        logger.info("Running benchmarks")
        
        # Get hardware info
        hardware_info = self.hardware_manager.get_hardware_info()
        
        # Get model IDs
        model_ids = self.model_registry.get_model_ids()
        
        # Run benchmarks for each model
        for model_id in model_ids:
            logger.info(f"Benchmarking model: {model_id}")
            
            try:
                # Run benchmark
                model_results = self._benchmark_model(model_id)
                
                if model_results:
                    # Save results
                    self.results[model_id] = model_results
                    logger.info(f"Benchmark completed for model {model_id}: {model_results}")
                else:
                    logger.error(f"Benchmark failed for model {model_id}")
            except Exception as e:
                logger.error(f"Error benchmarking model {model_id}: {e}")
        
        # Calculate aggregate results
        aggregate_results = {
            "hardware_info": hardware_info,
            "inference_speed": self._calculate_aggregate_inference_speed(),
            "max_batch_size": self._calculate_aggregate_max_batch_size(),
            "models": self.results
        }
        
        # Save results to file
        try:
            with open(self.results_file, 'w') as f:
                json.dump(aggregate_results, f, indent=2)
            logger.info(f"Saved benchmark results to {self.results_file}")
        except Exception as e:
            logger.error(f"Error saving benchmark results: {e}")
        
        return aggregate_results
    
    def _benchmark_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Benchmark a specific model
        
        Args:
            model_id: Model ID
            
        Returns:
            Benchmark results or None if failed
        """
        # Get model info
        model_info = self.model_registry.get_model_info(model_id)
        
        if not model_info:
            logger.error(f"Model {model_id} not found")
            return None
        
        # Load model
        if not self.model_registry.load_model(model_id):
            logger.error(f"Failed to load model {model_id}")
            return None
        
        model_instance = self.model_registry.get_model_instance(model_id)
        
        if not model_instance:
            logger.error(f"Failed to get model instance for {model_id}")
            return None
        
        # Run benchmarks based on model type
        if model_id.startswith("lb-llama") or model_id.startswith("lb-mixtral"):
            return self._benchmark_llm(model_id, model_instance)
        elif model_id.startswith("lb-embedding"):
            return self._benchmark_embedding(model_id, model_instance)
        else:
            logger.warning(f"Unknown model type for {model_id}, using generic benchmark")
            return self._benchmark_generic(model_id, model_instance)
    
    def _benchmark_llm(self, model_id: str, model_instance: Any) -> Dict[str, Any]:
        """
        Benchmark a language model
        
        Args:
            model_id: Model ID
            model_instance: Model instance
            
        Returns:
            Benchmark results
        """
        logger.info(f"Running LLM benchmark for {model_id}")
        
        # Prepare benchmark prompts
        prompts = [
            "Once upon a time",
            "The quick brown fox jumps over the lazy dog",
            "Explain the theory of relativity in simple terms",
            "Write a poem about artificial intelligence",
            "Translate the following English text to French: 'Hello, how are you?'"
        ]
        
        # Measure inference speed
        inference_times = []
        token_counts = []
        
        for prompt in prompts:
            # Warm-up
            if hasattr(model_instance, "generate"):
                _ = model_instance.generate(prompt, max_tokens=50)
            elif hasattr(model_instance, "create_completion"):
                _ = model_instance.create_completion(prompt, max_tokens=50)
            
            # Benchmark
            start_time = time.time()
            
            if hasattr(model_instance, "generate"):
                output = model_instance.generate(prompt, max_tokens=50)
                tokens = len(output.split())
            elif hasattr(model_instance, "create_completion"):
                output = model_instance.create_completion(prompt, max_tokens=50)
                tokens = len(output.split())
            else:
                # Fallback for llama_cpp
                output = model_instance(prompt, max_tokens=50)
                tokens = len(output['choices'][0]['text'].split())
            
            end_time = time.time()
            
            inference_time = end_time - start_time
            inference_times.append(inference_time)
            token_counts.append(tokens)
        
        # Calculate average inference speed (tokens per second)
        avg_inference_time = np.mean(inference_times)
        avg_token_count = np.mean(token_counts)
        inference_speed = avg_token_count / avg_inference_time if avg_inference_time > 0 else 0
        
        # Determine max batch size
        max_batch_size = self._determine_max_batch_size(model_id, model_instance)
        
        # Unload model
        self.model_registry.unload_model(model_id)
        
        return {
            "inference_speed": round(inference_speed, 2),
            "max_batch_size": max_batch_size,
            "avg_inference_time": round(avg_inference_time, 4),
            "avg_token_count": round(avg_token_count, 2)
        }
    
    def _benchmark_embedding(self, model_id: str, model_instance: Any) -> Dict[str, Any]:
        """
        Benchmark an embedding model
        
        Args:
            model_id: Model ID
            model_instance: Model instance
            
        Returns:
            Benchmark results
        """
        logger.info(f"Running embedding benchmark for {model_id}")
        
        # Prepare benchmark texts
        texts = [
            "The quick brown fox jumps over the lazy dog",
            "Artificial intelligence is transforming the world",
            "Machine learning models can process natural language",
            "Embeddings are vector representations of text",
            "Neural networks learn patterns from data"
        ]
        
        # Measure inference speed
        inference_times = []
        
        for text in texts:
            # Warm-up
            if isinstance(model_instance, dict) and "model" in model_instance and "tokenizer" in model_instance:
                # Transformers model
                tokenizer = model_instance["tokenizer"]
                model = model_instance["model"]
                
                inputs = tokenizer(text, return_tensors="pt")
                if next(model.parameters()).is_cuda:
                    inputs = {k: v.cuda() for k, v in inputs.items()}
                _ = model(**inputs)
            else:
                # Generic model
                _ = model_instance.embed(text)
            
            # Benchmark
            start_time = time.time()
            
            if isinstance(model_instance, dict) and "model" in model_instance and "tokenizer" in model_instance:
                # Transformers model
                tokenizer = model_instance["tokenizer"]
                model = model_instance["model"]
                
                inputs = tokenizer(text, return_tensors="pt")
                if next(model.parameters()).is_cuda:
                    inputs = {k: v.cuda() for k, v in inputs.items()}
                _ = model(**inputs)
            else:
                # Generic model
                _ = model_instance.embed(text)
            
            end_time = time.time()
            
            inference_time = end_time - start_time
            inference_times.append(inference_time)
        
        # Calculate average inference speed (embeddings per second)
        avg_inference_time = np.mean(inference_times)
        inference_speed = 1 / avg_inference_time if avg_inference_time > 0 else 0
        
        # Determine max batch size
        max_batch_size = self._determine_max_batch_size(model_id, model_instance, is_embedding=True)
        
        # Unload model
        self.model_registry.unload_model(model_id)
        
        return {
            "inference_speed": round(inference_speed, 2),
            "max_batch_size": max_batch_size,
            "avg_inference_time": round(avg_inference_time, 4)
        }
    
    def _benchmark_generic(self, model_id: str, model_instance: Any) -> Dict[str, Any]:
        """
        Generic benchmark for any model
        
        Args:
            model_id: Model ID
            model_instance: Model instance
            
        Returns:
            Benchmark results
        """
        logger.info(f"Running generic benchmark for {model_id}")
        
        # Measure memory usage
        import psutil
        process = psutil.Process(os.getpid())
        memory_before = process.memory_info().rss
        
        # Run a simple inference
        start_time = time.time()
        
        try:
            if hasattr(model_instance, "generate"):
                _ = model_instance.generate("Test input", max_tokens=10)
            elif hasattr(model_instance, "create_completion"):
                _ = model_instance.create_completion("Test input", max_tokens=10)
            elif hasattr(model_instance, "embed"):
                _ = model_instance.embed("Test input")
            elif hasattr(model_instance, "__call__"):
                _ = model_instance("Test input")
            else:
                logger.warning(f"Unknown model interface for {model_id}")
        except Exception as e:
            logger.error(f"Error during generic benchmark: {e}")
        
        end_time = time.time()
        
        # Measure memory usage again
        memory_after = process.memory_info().rss
        memory_usage = memory_after - memory_before
        
        # Calculate inference speed (arbitrary units)
        inference_time = end_time - start_time
        inference_speed = 1 / inference_time if inference_time > 0 else 0
        
        # Unload model
        self.model_registry.unload_model(model_id)
        
        return {
            "inference_speed": round(inference_speed, 2),
            "max_batch_size": 1,
            "memory_usage_mb": round(memory_usage / (1024 * 1024), 2),
            "inference_time": round(inference_time, 4)
        }
    
    def _determine_max_batch_size(self, model_id: str, model_instance: Any, is_embedding: bool = False) -> int:
        """
        Determine the maximum batch size for a model
        
        Args:
            model_id: Model ID
            model_instance: Model instance
            is_embedding: Whether the model is an embedding model
            
        Returns:
            Maximum batch size
        """
        # Start with batch size 1
        batch_size = 1
        max_batch_size = 1
        
        # Get GPU memory
        gpu_memory = 0
        if self.hardware_manager.gpus:
            gpu_memory = self.hardware_manager.gpus[0]["available_memory_mb"]
        
        # If no GPU, limit batch size
        if gpu_memory == 0:
            return 1
        
        # Increase batch size until we run out of memory or hit a limit
        max_attempts = 5
        
        for _ in range(max_attempts):
            batch_size *= 2
            
            try:
                if is_embedding:
                    # Test with embedding model
                    texts = ["Test input"] * batch_size
                    
                    if isinstance(model_instance, dict) and "model" in model_instance and "tokenizer" in model_instance:
                        # Transformers model
                        tokenizer = model_instance["tokenizer"]
                        model = model_instance["model"]
                        
                        inputs = tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
                        if next(model.parameters()).is_cuda:
                            inputs = {k: v.cuda() for k, v in inputs.items()}
                        _ = model(**inputs)
                    else:
                        # Generic model
                        _ = model_instance.embed(texts)
                else:
                    # Test with LLM
                    if hasattr(model_instance, "generate"):
                        _ = model_instance.generate(["Test input"] * batch_size, max_tokens=10)
                    elif hasattr(model_instance, "create_completion"):
                        _ = model_instance.create_completion(["Test input"] * batch_size, max_tokens=10)
                    else:
                        # Fallback for llama_cpp (which doesn't support batching)
                        break
                
                # If successful, update max batch size
                max_batch_size = batch_size
                
            except Exception as e:
                logger.info(f"Batch size {batch_size} failed: {e}")
                break
        
        return max_batch_size
    
    def _calculate_aggregate_inference_speed(self) -> float:
        """
        Calculate aggregate inference speed across all models
        
        Returns:
            Aggregate inference speed
        """
        if not self.results:
            return 0
        
        speeds = [result.get("inference_speed", 0) for result in self.results.values()]
        return round(np.mean(speeds), 2)
    
    def _calculate_aggregate_max_batch_size(self) -> int:
        """
        Calculate aggregate max batch size across all models
        
        Returns:
            Aggregate max batch size
        """
        if not self.results:
            return 1
        
        batch_sizes = [result.get("max_batch_size", 1) for result in self.results.values()]
        return int(np.mean(batch_sizes))
    
    def get_results(self) -> Dict[str, Any]:
        """
        Get benchmark results
        
        Returns:
            Benchmark results
        """
        # Get hardware info
        hardware_info = self.hardware_manager.get_hardware_info()
        
        # Calculate aggregate results
        aggregate_results = {
            "hardware_info": hardware_info,
            "inference_speed": self._calculate_aggregate_inference_speed(),
            "max_batch_size": self._calculate_aggregate_max_batch_size(),
            "models": self.results
        }
        
        return aggregate_results
