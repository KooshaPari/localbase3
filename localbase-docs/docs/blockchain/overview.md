---
sidebar_position: 1
---

# Blockchain Overview

The LocalBase blockchain is the foundation of the decentralized AI compute marketplace. It handles provider registration, job management, payments, and governance. This guide provides an overview of the blockchain, its features, and how it works.

## What is the LocalBase Blockchain?

The LocalBase blockchain is a Cosmos SDK-based blockchain that provides the infrastructure for the LocalBase marketplace. It enables secure, transparent, and decentralized transactions between users and providers.

## Key Features

### Provider Registry

The blockchain maintains a registry of providers, including:

- **Provider Information**: Name, description, endpoint, and supported models
- **Staking**: Providers stake tokens to participate in the network
- **Reputation**: Providers build reputation based on their performance
- **Uptime**: The blockchain tracks provider uptime

### Job Management

The blockchain handles job management, including:

- **Job Creation**: Users create jobs with specific requirements
- **Job Assignment**: Jobs are assigned to providers based on price, performance, and availability
- **Job Execution**: Providers execute jobs and report results
- **Job Verification**: The blockchain verifies job execution

### Payment System

The blockchain processes payments between users and providers:

- **Token Transfers**: Users pay providers in LocalBase tokens
- **Fee Structure**: The blockchain defines the fee structure for different job types
- **Escrow**: Payments are held in escrow until jobs are completed
- **Refunds**: Users can request refunds for failed jobs

### Governance

The blockchain enables on-chain governance:

- **Proposals**: Token holders can submit proposals for changes to the network
- **Voting**: Token holders vote on proposals
- **Parameter Changes**: Governance can change network parameters
- **Upgrades**: Governance can approve network upgrades

## Architecture

The LocalBase blockchain is built on the Cosmos SDK, which provides a modular framework for building blockchain applications. The blockchain consists of the following modules:

### Provider Module

The provider module manages provider registration and staking:

- **Registration**: Providers register by submitting their information and staking tokens
- **Staking**: Providers stake tokens to participate in the network
- **Unstaking**: Providers can unstake tokens after a cooldown period
- **Slashing**: Providers can be slashed for misbehavior

### Job Module

The job module handles job creation, assignment, and completion:

- **Creation**: Users create jobs with specific requirements
- **Assignment**: Jobs are assigned to providers based on price, performance, and availability
- **Execution**: Providers execute jobs and report results
- **Verification**: The blockchain verifies job execution

### Tokenomics Module

The tokenomics module manages token economics and inflation:

- **Inflation**: The blockchain issues new tokens at a predetermined rate
- **Distribution**: New tokens are distributed to validators, providers, and the community pool
- **Burning**: Tokens can be burned to reduce supply
- **Fees**: The blockchain collects fees for transactions

### Governance Module

The governance module enables on-chain governance:

- **Proposals**: Token holders can submit proposals for changes to the network
- **Voting**: Token holders vote on proposals
- **Parameter Changes**: Governance can change network parameters
- **Upgrades**: Governance can approve network upgrades

## Consensus

The LocalBase blockchain uses the Tendermint consensus algorithm, which provides:

- **Fast Finality**: Transactions are final once included in a block
- **High Throughput**: The blockchain can process thousands of transactions per second
- **Byzantine Fault Tolerance**: The blockchain can tolerate up to 1/3 of validators being malicious

## Validators

Validators are responsible for maintaining the blockchain:

- **Block Production**: Validators produce blocks by proposing and validating transactions
- **Staking**: Validators stake tokens to participate in consensus
- **Delegation**: Token holders can delegate tokens to validators
- **Rewards**: Validators earn rewards for producing blocks

## Smart Contracts

The LocalBase blockchain supports smart contracts through CosmWasm:

- **Provider Registry Contract**: Manages provider registration and staking
- **Job Management Contract**: Handles job creation, assignment, and completion
- **Governance Contract**: Enables on-chain governance

## Token Economics

The LocalBase token (LB) is the native token of the blockchain:

- **Utility**: The token is used for payments, staking, and governance
- **Supply**: The token has a fixed initial supply with controlled inflation
- **Distribution**: Tokens are distributed to validators, providers, and the community pool
- **Burning**: Tokens can be burned to reduce supply

## Next Steps

To learn more about the LocalBase blockchain, check out the following guides:

- [Architecture](architecture.md): Detailed architecture of the blockchain
- [Smart Contracts](smart-contracts.md): How smart contracts work on the blockchain
- [Governance](governance.md): How governance works on the blockchain
- [Tokenomics](tokenomics.md): Token economics of the blockchain
- [Validators](validators.md): How to run a validator node
