#!/usr/bin/env python3
"""
Benchmark script for LocalBase provider node
"""

import os
import sys
import json
import time
import argparse
import logging
import requests
import statistics
import concurrent.futures
from typing import Dict, Any, List, Tuple

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

def load_config(config_path: str) -> Dict[str, Any]:
    """
    Load configuration from file
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Configuration dictionary
    """
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
        
        return config
        
    except Exception as e:
        logger.error(f"Error loading configuration: {e}")
        return {}

def parse_args():
    """
    Parse command line arguments
    
    Returns:
        Parsed arguments
    """
    parser = argparse.ArgumentParser(description="LocalBase Benchmark")
    
    parser.add_argument(
        "--config",
        type=str,
        default="config.json",
        help="Path to configuration file",
    )
    
    parser.add_argument(
        "--concurrency",
        type=int,
        default=10,
        help="Number of concurrent requests",
    )
    
    parser.add_argument(
        "--requests",
        type=int,
        default=100,
        help="Total number of requests",
    )
    
    parser.add_argument(
        "--model",
        type=str,
        default="gpt-3.5-turbo",
        help="Model to benchmark",
    )
    
    parser.add_argument(
        "--output",
        type=str,
        default="benchmark_results.json",
        help="Output file for benchmark results",
    )
    
    return parser.parse_args()

def create_job(url: str, api_key: str, model: str) -> Tuple[Dict[str, Any], float]:
    """
    Create a job and measure response time
    
    Args:
        url: Provider URL
        api_key: API key
        model: Model ID
        
    Returns:
        Tuple of (job data, response time)
    """
    # Set up headers
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json",
    }
    
    # Create job data
    job_data = {
        "model": model,
        "input": {
            "messages": [
                {"role": "user", "content": "Hello, world!"}
            ]
        },
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 100,
        },
        "type": "chat",
    }
    
    # Measure response time
    start_time = time.time()
    
    try:
        response = requests.post(f"{url}/jobs", json=job_data, headers=headers)
        
        end_time = time.time()
        response_time = end_time - start_time
        
        if response.status_code == 200:
            return response.json(), response_time
        else:
            logger.error(f"Error creating job: {response.text}")
            return None, response_time
            
    except Exception as e:
        end_time = time.time()
        response_time = end_time - start_time
        
        logger.error(f"Error creating job: {e}")
        return None, response_time

def wait_for_job(url: str, api_key: str, job_id: str, timeout: int = 60) -> Tuple[Dict[str, Any], float]:
    """
    Wait for a job to complete and measure processing time
    
    Args:
        url: Provider URL
        api_key: API key
        job_id: Job ID
        timeout: Timeout in seconds
        
    Returns:
        Tuple of (job data, processing time)
    """
    # Set up headers
    headers = {
        "X-API-Key": api_key,
    }
    
    # Wait for job completion
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{url}/jobs/{job_id}", headers=headers)
            
            if response.status_code == 200:
                job = response.json()
                
                if job["status"] in ["completed", "failed"]:
                    end_time = time.time()
                    processing_time = end_time - start_time
                    
                    return job, processing_time
                
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Error checking job status: {e}")
            time.sleep(1)
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    logger.error(f"Job {job_id} did not complete within {timeout} seconds")
    return None, processing_time

def run_benchmark(config_path: str, concurrency: int, num_requests: int, model: str) -> Dict[str, Any]:
    """
    Run benchmark
    
    Args:
        config_path: Path to configuration file
        concurrency: Number of concurrent requests
        num_requests: Total number of requests
        model: Model ID
        
    Returns:
        Benchmark results
    """
    # Load configuration
    config = load_config(config_path)
    provider_config = config.get("provider", {})
    
    url = provider_config.get("url")
    api_key = provider_config.get("api_key")
    
    if not url or not api_key:
        logger.error("Provider configuration not found")
        return {}
    
    # Initialize results
    results = {
        "config": {
            "concurrency": concurrency,
            "requests": num_requests,
            "model": model,
        },
        "response_times": [],
        "processing_times": [],
        "total_times": [],
        "success_rate": 0.0,
        "requests_per_second": 0.0,
        "start_time": time.time(),
        "end_time": 0.0,
    }
    
    # Run benchmark
    logger.info(f"Running benchmark with {concurrency} concurrent requests for {num_requests} total requests")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        # Submit jobs
        future_to_job = {}
        
        for i in range(num_requests):
            future = executor.submit(create_job, url, api_key, model)
            future_to_job[future] = i
        
        # Process results
        jobs = []
        
        for future in concurrent.futures.as_completed(future_to_job):
            job_index = future_to_job[future]
            
            try:
                job, response_time = future.result()
                
                if job:
                    jobs.append((job, response_time))
                    results["response_times"].append(response_time)
                    
                    logger.info(f"Job {job_index} created in {response_time:.2f} seconds")
                else:
                    logger.error(f"Job {job_index} creation failed")
                
            except Exception as e:
                logger.error(f"Job {job_index} creation failed: {e}")
        
        # Wait for jobs to complete
        future_to_job = {}
        
        for job, response_time in jobs:
            future = executor.submit(wait_for_job, url, api_key, job["id"])
            future_to_job[future] = job
        
        for future in concurrent.futures.as_completed(future_to_job):
            job = future_to_job[future]
            
            try:
                completed_job, processing_time = future.result()
                
                if completed_job:
                    results["processing_times"].append(processing_time)
                    results["total_times"].append(response_time + processing_time)
                    
                    logger.info(f"Job {job['id']} completed in {processing_time:.2f} seconds")
                else:
                    logger.error(f"Job {job['id']} processing failed")
                
            except Exception as e:
                logger.error(f"Job {job['id']} processing failed: {e}")
    
    # Calculate statistics
    results["end_time"] = time.time()
    results["duration"] = results["end_time"] - results["start_time"]
    
    if results["response_times"]:
        results["response_time_min"] = min(results["response_times"])
        results["response_time_max"] = max(results["response_times"])
        results["response_time_mean"] = statistics.mean(results["response_times"])
        results["response_time_median"] = statistics.median(results["response_times"])
        
        if len(results["response_times"]) > 1:
            results["response_time_stdev"] = statistics.stdev(results["response_times"])
        else:
            results["response_time_stdev"] = 0.0
    
    if results["processing_times"]:
        results["processing_time_min"] = min(results["processing_times"])
        results["processing_time_max"] = max(results["processing_times"])
        results["processing_time_mean"] = statistics.mean(results["processing_times"])
        results["processing_time_median"] = statistics.median(results["processing_times"])
        
        if len(results["processing_times"]) > 1:
            results["processing_time_stdev"] = statistics.stdev(results["processing_times"])
        else:
            results["processing_time_stdev"] = 0.0
    
    if results["total_times"]:
        results["total_time_min"] = min(results["total_times"])
        results["total_time_max"] = max(results["total_times"])
        results["total_time_mean"] = statistics.mean(results["total_times"])
        results["total_time_median"] = statistics.median(results["total_times"])
        
        if len(results["total_times"]) > 1:
            results["total_time_stdev"] = statistics.stdev(results["total_times"])
        else:
            results["total_time_stdev"] = 0.0
    
    results["success_rate"] = len(results["total_times"]) / num_requests * 100.0
    results["requests_per_second"] = len(results["total_times"]) / results["duration"]
    
    return results

def save_results(results: Dict[str, Any], output_path: str):
    """
    Save benchmark results to file
    
    Args:
        results: Benchmark results
        output_path: Output file path
    """
    try:
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Benchmark results saved to {output_path}")
        
    except Exception as e:
        logger.error(f"Error saving benchmark results: {e}")

def print_results(results: Dict[str, Any]):
    """
    Print benchmark results
    
    Args:
        results: Benchmark results
    """
    print("\nBenchmark Results:")
    print(f"Concurrency: {results['config']['concurrency']}")
    print(f"Requests: {results['config']['requests']}")
    print(f"Model: {results['config']['model']}")
    print(f"Duration: {results['duration']:.2f} seconds")
    print(f"Success Rate: {results['success_rate']:.2f}%")
    print(f"Requests Per Second: {results['requests_per_second']:.2f}")
    
    print("\nResponse Time (seconds):")
    print(f"Min: {results.get('response_time_min', 0):.2f}")
    print(f"Max: {results.get('response_time_max', 0):.2f}")
    print(f"Mean: {results.get('response_time_mean', 0):.2f}")
    print(f"Median: {results.get('response_time_median', 0):.2f}")
    print(f"StdDev: {results.get('response_time_stdev', 0):.2f}")
    
    print("\nProcessing Time (seconds):")
    print(f"Min: {results.get('processing_time_min', 0):.2f}")
    print(f"Max: {results.get('processing_time_max', 0):.2f}")
    print(f"Mean: {results.get('processing_time_mean', 0):.2f}")
    print(f"Median: {results.get('processing_time_median', 0):.2f}")
    print(f"StdDev: {results.get('processing_time_stdev', 0):.2f}")
    
    print("\nTotal Time (seconds):")
    print(f"Min: {results.get('total_time_min', 0):.2f}")
    print(f"Max: {results.get('total_time_max', 0):.2f}")
    print(f"Mean: {results.get('total_time_mean', 0):.2f}")
    print(f"Median: {results.get('total_time_median', 0):.2f}")
    print(f"StdDev: {results.get('total_time_stdev', 0):.2f}")

def main():
    """
    Main entry point
    """
    # Parse arguments
    args = parse_args()
    
    # Run benchmark
    results = run_benchmark(
        config_path=args.config,
        concurrency=args.concurrency,
        num_requests=args.requests,
        model=args.model,
    )
    
    # Save results
    save_results(results, args.output)
    
    # Print results
    print_results(results)

if __name__ == "__main__":
    main()
