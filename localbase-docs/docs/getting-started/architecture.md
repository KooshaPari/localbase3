---
sidebar_position: 4
---

# Architecture

This page provides an overview of the LocalBase architecture, explaining how the different components work together to create a decentralized AI compute marketplace.

## System Overview

LocalBase consists of three main components:

1. **Blockchain Backend**: Built on Cosmos SDK, handling provider registration, job management, payments, and governance
2. **Provider Software**: Secure node software for GPU owners to offer compute resources
3. **Frontend Interface**: User-friendly web interface for accessing the marketplace

These components interact to create a seamless experience for users, providers, and developers.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     Users       │     │    Providers    │     │   Validators    │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │     │  Provider Node  │     │ Blockchain Node │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                       ┌─────────────────┐
                       │                 │
                       │   Blockchain    │
                       │                 │
                       └─────────────────┘
```

## Component Details

### Blockchain Backend

The blockchain backend is built on the Cosmos SDK and provides the following functionality:

- **Provider Registry**: Manages provider registration, staking, and reputation
- **Job Management**: Handles job creation, assignment, and completion
- **Payment System**: Processes payments between users and providers
- **Governance**: Enables token holders to participate in platform governance

The blockchain uses the following modules:

- **Provider Module**: Manages provider registration and staking
- **Job Module**: Handles job creation, assignment, and completion
- **Tokenomics Module**: Manages token economics and inflation
- **Governance Module**: Enables on-chain governance

### Provider Software

The provider software runs on GPU-equipped machines and offers compute resources to the network. It includes:

- **Security Manager**: Ensures secure workload isolation
- **Job Processor**: Handles job execution and resource management
- **Monitoring System**: Monitors system performance and resource usage
- **Auto Scaler**: Dynamically scales resources based on demand
- **Blockchain Client**: Interacts with the blockchain for provider registration and job management
- **API Server**: Exposes an API for job submission and management

### Frontend Interface

The frontend interface provides a user-friendly way to interact with the LocalBase marketplace. It includes:

- **User Authentication**: Manages user registration and authentication
- **Job Management**: Allows users to create, monitor, and manage jobs
- **Provider Selection**: Enables users to select providers based on price, performance, and reputation
- **Billing Management**: Helps users manage their billing and payments
- **API Key Management**: Allows users to create and manage API keys

## Data Flow

### Job Creation and Execution

1. A user creates a job through the frontend or API
2. The job is submitted to the blockchain
3. The blockchain assigns the job to a provider based on price, performance, and availability
4. The provider executes the job in a secure environment
5. The provider reports the job results to the blockchain
6. The blockchain processes the payment from the user to the provider
7. The user receives the job results

### Provider Registration

1. A provider installs the provider software
2. The provider configures the software with their preferences
3. The provider registers on the blockchain by staking tokens
4. The blockchain adds the provider to the registry
5. The provider starts accepting jobs

## Security Model

LocalBase employs a multi-layered security approach:

- **Blockchain Security**: The blockchain provides a secure and transparent ledger for all transactions
- **Provider Security**: The provider software uses secure workload isolation to protect the provider's hardware
- **User Security**: The frontend and API use secure authentication and encryption to protect user data
- **Job Security**: Jobs are executed in isolated environments to prevent interference and data leakage

## Scalability

LocalBase is designed to scale horizontally:

- **Blockchain Scalability**: The Cosmos SDK provides high throughput and low latency
- **Provider Scalability**: Providers can scale their resources based on demand
- **Frontend Scalability**: The frontend is built with Next.js, which provides excellent scalability

## Next Steps

Now that you understand the LocalBase architecture, you can:

- Explore the [API Reference](../api-reference/overview.md) for more details
- Check out the [Guides](../guides/overview.md) for specific use cases
- Learn about [Blockchain](../blockchain/overview.md) for more details on the blockchain backend
- Explore [Provider Node](../provider/overview.md) for more details on the provider software
