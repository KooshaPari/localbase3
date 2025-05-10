# LocalBase Chain

LocalBase Chain is a Cosmos SDK-based blockchain for the LocalBase decentralized AI compute marketplace. It provides the infrastructure for GPU providers to register, users to submit jobs, and payments to be processed.

## Modules

- **Provider Registry**: Manages GPU provider registration and metadata
- **Job Scheduler**: Handles job submission, execution, and result delivery
- **Payment**: Manages escrow and payment processing
- **Reputation**: Tracks provider quality metrics

## Getting Started

### Prerequisites

- Go 1.19+
- Cosmos SDK
- CosmWasm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/localbase-chain.git
cd localbase-chain

# Install dependencies
go mod tidy

# Build the chain
make install

# Initialize the chain
localbasechaind init my-node --chain-id localbase-1

# Add a key
localbasechaind keys add my-key

# Add genesis account
localbasechaind add-genesis-account my-key 100000000ulb

# Generate genesis transaction
localbasechaind gentx my-key 100000000ulb --chain-id localbase-1

# Collect genesis transactions
localbasechaind collect-gentxs

# Start the chain
localbasechaind start
```

## Usage

### Provider Registration

```bash
localbasechaind tx provider register \
  --hardware-info '{"gpu_type":"NVIDIA RTX 4090","vram":"24GB","cpu_cores":16,"ram":"64GB"}' \
  --benchmark-results '{"inference_speed":120,"max_batch_size":8}' \
  --pricing '{"lb-llama-3-70b":{"input_price_per_token":0.00000002,"output_price_per_token":0.00000005}}' \
  --models-supported lb-llama-3-70b,lb-mixtral-8x7b \
  --from my-key \
  --chain-id localbase-1
```

### Job Submission

```bash
localbasechaind tx job create \
  --model lb-llama-3-70b \
  --provider provider_1 \
  --input '{"prompt":"Hello, world!"}' \
  --from my-key \
  --chain-id localbase-1
```

### Query Providers

```bash
localbasechaind query provider list
localbasechaind query provider get provider_1
localbasechaind query provider list-by-model lb-llama-3-70b
```

### Query Jobs

```bash
localbasechaind query job list
localbasechaind query job get job_1
localbasechaind query job list-by-provider provider_1
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
