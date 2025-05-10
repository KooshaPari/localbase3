---
sidebar_position: 1
---

# Provider Overview

The LocalBase Provider Node is a software component that allows GPU owners to offer compute resources on the LocalBase marketplace. This guide provides an overview of the provider node, its features, and how it works.

## What is a Provider Node?

A provider node is a software component that runs on a GPU-equipped machine and offers compute resources to the LocalBase network. It handles job execution, resource management, security, and communication with the blockchain.

## Key Features

### Secure Workload Isolation

The provider node uses multiple layers of security to isolate workloads:

- **Seccomp Filtering**: Restricts the system calls that can be made by the job
- **AppArmor Profiles**: Controls access to files and resources
- **Cgroups**: Limits resource usage (CPU, memory, disk, etc.)
- **Network Isolation**: Restricts network access for jobs

### Monitoring and Alerting

The provider node includes a comprehensive monitoring system:

- **System Metrics**: Monitors CPU, memory, disk, and network usage
- **GPU Metrics**: Monitors GPU usage, memory, temperature, and power
- **Job Metrics**: Tracks job queue size, processing time, and error rate
- **Alerting**: Sends alerts when metrics exceed thresholds

### Automatic Scaling

The provider node can automatically scale resources based on demand:

- **Worker Scaling**: Adjusts the number of worker processes based on resource usage and job queue size
- **Resource Allocation**: Allocates resources to jobs based on their requirements
- **Cooldown Periods**: Prevents rapid scaling up and down

### Blockchain Integration

The provider node integrates with the LocalBase blockchain:

- **Provider Registration**: Registers the provider on the blockchain
- **Job Management**: Receives jobs from the blockchain and reports results
- **Payment Processing**: Receives payments for completed jobs
- **Reputation Management**: Maintains the provider's reputation on the blockchain

### OpenAI-Compatible API

The provider node exposes an OpenAI-compatible API:

- **Chat Completions**: `/v1/chat/completions`
- **Completions**: `/v1/completions`
- **Embeddings**: `/v1/embeddings`
- **Models**: `/v1/models`

## How It Works

### Provider Registration

1. The provider installs the provider node software
2. The provider configures the software with their preferences
3. The provider registers on the blockchain by staking tokens
4. The blockchain adds the provider to the registry
5. The provider starts accepting jobs

### Job Execution

1. The provider node receives a job from the blockchain
2. The job is added to the job queue
3. A worker process picks up the job from the queue
4. The worker creates a secure environment for the job
5. The job is executed in the secure environment
6. The results are returned to the blockchain
7. The provider receives payment for the job

### Resource Management

1. The monitoring system collects metrics about system and job performance
2. The auto scaler analyzes the metrics and makes scaling decisions
3. Worker processes are started or stopped based on scaling decisions
4. Resources are allocated to jobs based on their requirements

## Provider Economics

Providers earn tokens for executing jobs on the network. The amount earned depends on:

- **Job Complexity**: More complex jobs earn more tokens
- **Resource Usage**: Jobs that use more resources earn more tokens
- **Provider Reputation**: Providers with higher reputation can charge more
- **Market Demand**: Prices fluctuate based on supply and demand

Providers also need to stake tokens to participate in the network. The stake serves as:

- **Security Deposit**: Ensures providers behave honestly
- **Quality Assurance**: Higher stakes indicate higher quality providers
- **Governance Participation**: Staked tokens can be used for governance voting

## Next Steps

To learn more about the provider node, check out the following guides:

- [Installation](installation.md): How to install the provider node
- [Configuration](configuration.md): How to configure the provider node
- [Security](security.md): How the provider node ensures security
- [Monitoring](monitoring.md): How to monitor the provider node
- [Scaling](scaling.md): How the provider node scales resources
- [Troubleshooting](troubleshooting.md): How to troubleshoot common issues
