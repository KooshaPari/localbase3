# LocalBase Provider Node

LocalBase Provider Node is a client application for GPU providers to participate in the LocalBase decentralized AI compute marketplace. It allows GPU owners to monetize their idle resources by offering AI inference services to users.

## Features

- Hardware detection and resource management
- Docker container management for workload isolation
- Benchmarking tools for standardized performance metrics
- Blockchain client for provider registration and job management
- Model registry and hosting capabilities
- Security layers for workload isolation

## Getting Started

### Prerequisites

- Python 3.9+
- Docker
- NVIDIA GPU with CUDA support
- NVIDIA Container Toolkit

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/localbase-provider.git
cd localbase-provider

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure the provider
cp config.example.yaml config.yaml
# Edit config.yaml with your settings
```

### Configuration

Edit the `config.yaml` file to configure your provider node:

```yaml
# Provider configuration
provider:
  name: "My Provider Node"
  region: "us-west"
  
# Hardware configuration
hardware:
  gpu_memory_reserve: 1024  # MB to reserve for system
  cpu_cores_reserve: 2      # CPU cores to reserve for system
  
# Blockchain configuration
blockchain:
  node_url: "http://localhost:26657"
  chain_id: "localbase-1"
  wallet_mnemonic: "your wallet mnemonic phrase"
  
# Models configuration
models:
  - id: "lb-llama-3-70b"
    pricing:
      input_price_per_token: 0.00000002
      output_price_per_token: 0.00000005
  - id: "lb-mixtral-8x7b"
    pricing:
      input_price_per_token: 0.00000001
      output_price_per_token: 0.00000003
      
# Security configuration
security:
  max_memory_per_job: 24000  # MB
  max_cpu_per_job: 8         # CPU cores
  network_isolation: true
```

### Usage

```bash
# Start the provider node
python -m localbase_provider.main

# Run benchmarks
python -m localbase_provider.benchmark

# Register provider on blockchain
python -m localbase_provider.register
```

## Architecture

The LocalBase Provider Node consists of the following components:

### Hardware Manager

Detects and manages hardware resources, including:
- GPU detection and monitoring
- CPU and memory allocation
- Resource limits enforcement

### Container Manager

Manages Docker containers for workload isolation:
- Container creation and lifecycle management
- Resource allocation and limits
- Network isolation and security

### Blockchain Client

Interfaces with the LocalBase blockchain:
- Provider registration and updates
- Job management (accepting, processing, completing)
- Payment processing

### Model Registry

Manages AI models:
- Model downloading and versioning
- Model caching and optimization
- Format conversion and compatibility

### Benchmarking Engine

Provides standardized performance metrics:
- Inference speed benchmarks
- Memory usage benchmarks
- Throughput and latency measurements

### Job Scheduler

Manages job execution:
- Job queue management
- Resource allocation
- Priority scheduling

## License

This project is licensed under the MIT License - see the LICENSE file for details.
