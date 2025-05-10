---
sidebar_position: 2
---

# Installation

This guide will help you install the various components of the LocalBase platform. Depending on your role, you may need to install different components.

## Prerequisites

Before installing LocalBase, ensure you have the following prerequisites:

- **For All Users**:
  - Git
  - Node.js 16.x or higher
  - npm or yarn
  - Docker (optional, for containerized deployment)

- **For Providers**:
  - Linux operating system (Ubuntu 20.04 or higher recommended)
  - NVIDIA GPU with CUDA support (for GPU acceleration)
  - NVIDIA drivers and CUDA toolkit
  - Python 3.8 or higher
  - Docker and Docker Compose

- **For Blockchain Validators**:
  - Linux operating system (Ubuntu 20.04 or higher recommended)
  - 4+ CPU cores
  - 16+ GB RAM
  - 500+ GB SSD storage
  - Stable internet connection

## Installing the Frontend

The frontend provides a user interface for interacting with the LocalBase marketplace.

### Option 1: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/localbase/localbase.git
cd localbase/localbase-frontend

# Install dependencies
npm install

# Create a .env.local file
cp .env.local.example .env.local

# Edit the .env.local file with your configuration
nano .env.local

# Start the development server
npm run dev
```

### Option 2: Docker Deployment

```bash
# Clone the repository
git clone https://github.com/localbase/localbase.git
cd localbase/localbase-frontend

# Create a .env.local file
cp .env.local.example .env.local

# Edit the .env.local file with your configuration
nano .env.local

# Build and run the Docker container
docker build -t localbase-frontend .
docker run -p 3000:3000 localbase-frontend
```

### Configuration

Edit the `.env.local` file to configure the frontend:

```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# API configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Blockchain configuration
NEXT_PUBLIC_CHAIN_ID=localbase-testnet-1
NEXT_PUBLIC_CHAIN_RPC=http://localhost:26657
NEXT_PUBLIC_CHAIN_REST=http://localhost:1317
```

## Installing the Provider Node

The provider node allows GPU owners to offer compute resources on the LocalBase marketplace.

### Option 1: Install from Source

```bash
# Clone the repository
git clone https://github.com/localbase/localbase.git
cd localbase/localbase-provider

# Install the package
pip install -e .

# Install GPU support
pip install -e ".[gpu]"

# Create a configuration file
localbase-provider --config config.json

# Edit the configuration file
nano config.json

# Start the provider node
localbase-provider --config config.json
```

### Option 2: Docker Deployment

```bash
# Clone the repository
git clone https://github.com/localbase/localbase.git
cd localbase/localbase-provider

# Create a configuration file
cp config.example.json config.json

# Edit the configuration file
nano config.json

# Build and run the Docker container
docker build -t localbase-provider .
docker run -d \
  --name localbase-provider \
  -p 8000:8000 \
  -v $(pwd)/config.json:/app/config.json \
  -v /var/lib/localbase:/var/lib/localbase \
  --gpus all \
  localbase-provider
```

### Configuration

Edit the `config.json` file to configure the provider node. See the [Provider Configuration](../provider/configuration.md) guide for details.

## Installing the Blockchain Node

The blockchain node allows you to participate in the LocalBase network as a validator or a full node.

### Option 1: Install from Source

```bash
# Clone the repository
git clone https://github.com/localbase/localbase.git
cd localbase/localbase-chain

# Install Go (if not already installed)
wget https://go.dev/dl/go1.19.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.19.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# Build the binary
make install

# Initialize the node
localbase init <your-moniker> --chain-id localbase-testnet-1

# Download the genesis file
curl -s https://raw.githubusercontent.com/localbase/networks/main/testnet-1/genesis.json > ~/.localbase/config/genesis.json

# Add seeds and persistent peers
nano ~/.localbase/config/config.toml

# Start the node
localbase start
```

### Option 2: Docker Deployment

```bash
# Clone the repository
git clone https://github.com/localbase/localbase.git
cd localbase/localbase-chain

# Create a data directory
mkdir -p data

# Run the Docker container
docker run -d \
  --name localbase-node \
  -p 26656:26656 \
  -p 26657:26657 \
  -p 1317:1317 \
  -v $(pwd)/data:/root/.localbase \
  localbase/node:latest
```

### Configuration

Edit the configuration files in `~/.localbase/config/` to configure the blockchain node. See the [Blockchain Configuration](../blockchain/validators.md) guide for details.

## Next Steps

Now that you have installed the LocalBase components, you can:

- [Quick Start](quick-start.md): Run your first AI job on LocalBase
- [Architecture](architecture.md): Learn about the LocalBase architecture
