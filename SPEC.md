# SPEC: LocalBase3 — Decentralized AI Compute Marketplace

## Meta

- **ID**: localbase-003
- **Title**: LocalBase3 Specification — Decentralized AI Compute Marketplace
- **Created**: 2026-04-04
- **State**: specified
- **Version**: 3.0.0
- **Languages**: TypeScript, Go (Cosmos SDK)

---

## Overview

LocalBase3 is a decentralized AI compute marketplace built on Cosmos SDK. It connects GPU owners (providers) with AI developers (consumers) through a blockchain-based marketplace, featuring an OpenAI-compatible API and a React frontend for seamless integration.

---

## ASCII Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LocalBase3 Architecture                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                      Frontend Layer (Next.js)                       │    │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │    │
│   │  │   Provider   │  │   Consumer   │  │   Admin      │                │    │
│   │  │   Dashboard  │  │   Portal     │  │   Panel      │                │    │
│   │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                │    │
│   └─────────┼─────────────────┼─────────────────┼────────────────────────┘    │
│             │                 │                 │                              │
│   ┌─────────┴─────────────────┴─────────────────┴─────────────────────────────┐   │
│   │                       API Layer (OpenAI-compatible)                        │   │
│   │  ┌─────────────────────────────────────────────────────────────────┐     │   │
│   │  │              localbase-api (Node.js/Fastify)                     │     │   │
│   │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│     │   │
│   │  │  │ /v1/chat │ │ /v1/embed│ │ /v1/models│ │ /v1/fine │ │  Auth    ││     │   │
│   │  │  │/completions│ │  dings   │             │  -tune   │  (JWT)   ││     │   │
│   │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│     │   │
│   │  └─────────────────────────────────────────────────────────────────┘     │   │
│   └─────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                           │
│   ┌─────────────────────────────────┴────────────────────────────────────────┐   │
│   │                      Blockchain Layer (Cosmos SDK)                        │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐    │   │
│   │  │ localbase-chain │  │  Job Matching   │  │  Provider Registry      │    │   │
│   │  │ (Go/Cosmos SDK) │  │  Engine         │  │  (staking/slashing)     │    │   │
│   │  │                 │  │                 │  │                         │    │   │
│   │  │ • Tendermint    │  │ • Bid/Ask       │  │ • GPU verification      │    │   │
│   │  │ • IBC Protocol    │  │ • Job routing   │  │ • Reputation system     │    │   │
│   │  │ • CosmWasm        │  │ • Payment       │  │ • Uptime tracking       │    │   │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘    │   │
│   └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        Provider Software Layer                            │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐    │   │
│   │  │  localbase-     │  │  GPU Workload   │  │  Monitoring/Health      │    │   │
│   │  │  provider       │  │  Executor       │  │  (Prometheus/OTel)      │    │   │
│   │  │  (Node.js)      │  │  (Docker/VM)    │  │                         │    │   │
│   │  │                 │  │                 │  │                         │    │   │
│   │  │ • Node discovery│  │ • Container mgmt│  │ • Metrics export        │    │   │
│   │  │ • Job execution │  │ • Model loading │  │ • Alerting              │    │   │
│   │  │ • Proof of work │  │ • GPU isolation │  │ • Status updates        │    │   │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘    │   │
│   └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Components Table

| Component | Path | Language | Responsibility | Status |
|-----------|------|----------|----------------|--------|
| **Frontend** | `localbase-frontend/` | TypeScript/Next.js | User interface, dashboards | Active |
| **API** | `localbase-api/` | TypeScript/Node.js | OpenAI-compatible REST API | Active |
| **Chain** | `localbase-chain/` | Go/Cosmos SDK | Blockchain consensus layer | Active |
| **Provider** | `localbase-provider/` | TypeScript/Node.js | Provider node software | Active |
| **Tests** | `localbase-tests/` | TypeScript | Integration and security tests | Active |

---

## Data Models

### Job Request
```typescript
interface JobRequest {
  id: string;
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  consumer_id: string;
  bid_amount: string; // uToken
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### Provider Registration
```typescript
interface Provider {
  id: string;
  address: string; // blockchain address
  gpu_specs: GpuSpecs;
  staking_amount: string;
  reputation_score: number;
  uptime_percentage: number;
  available_models: string[];
  endpoint_url: string;
  status: 'active' | 'inactive' | 'slashed';
}

interface GpuSpecs {
  model: string;
  vram_gb: number;
  cuda_cores: number;
  benchmark_score: number;
}
```

### Job Result (on-chain)
```go
type JobResult struct {
    JobID         string    `json:"job_id"`
    ProviderID    string    `json:"provider_id"`
    ConsumerID    string    `json:"consumer_id"`
    OutputHash    string    `json:"output_hash"` // IPFS hash
    TokensUsed    uint64    `json:"tokens_used"`
    CompletionTime time.Time `json:"completion_time"`
    ProofOfWork   []byte    `json:"proof_of_work"`
}
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time** | < 200ms p95 | Inference endpoint latency |
| **Job Matching** | < 5s | Provider selection time |
| **Block Time** | ~6s | Cosmos SDK target |
| **Provider Discovery** | < 30s | New provider visible to consumers |
| **Payment Settlement** | ~6s | On-chain confirmation time |
| **Concurrent Jobs** | 1000+ | Per provider capacity |

---

## API Endpoints (OpenAI-compatible)

| Endpoint | Description |
|----------|-------------|
| `POST /v1/chat/completions` | Chat completion with streaming support |
| `POST /v1/embeddings` | Text embedding generation |
| `GET /v1/models` | List available models |
| `POST /v1/completions` | Legacy completion endpoint |
| `POST /v1/fine-tunes` | Model fine-tuning (future) |

---

## Blockchain Messages (Cosmos SDK)

| Message | Purpose |
|---------|---------|
| `MsgRegisterProvider` | Register as compute provider |
| `MsgUnregisterProvider` | Deregister provider |
| `MsgSubmitJob` | Submit compute job |
| `MsgClaimJob` | Provider claims available job |
| `MsgSubmitProof` | Submit proof of computation |
| `MsgSlashProvider` | Slash provider for fraud/failure |

---

## Dependencies

| Category | Key Dependencies | Version |
|----------|------------------|---------|
| **Frontend** | next, react, @cosmjs/* | 14.x |
| **API** | fastify, @supabase/supabase-js, openai | 4.x |
| **Chain** | cosmos-sdk, tendermint, wasmd | 0.47.x |
| **Provider** | dockerode, @tensorflow/tfjs-node, axios | 3.x |

---

## Workspace Structure

```
localbase3/
├── localbase-frontend/        # Next.js frontend
│   ├── app/
│   ├── components/
│   └── lib/
├── localbase-api/             # REST API server
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── models/
│   └── tests/
├── localbase-chain/           # Cosmos SDK blockchain
│   ├── app/
│   ├── proto/
│   └── x/                     # Modules
├── localbase-provider/        # Provider node software
│   ├── src/
│   │   ├── executor/
│   │   ├── blockchain/
│   │   └── monitoring/
│   └── tests/
├── localbase-tests/           # Integration tests
│   ├── integration/
│   └── security/
└── README.md
```

---

## References

1. [Cosmos SDK](https://docs.cosmos.network/) — Blockchain framework
2. [Tendermint](https://docs.tendermint.com/) — Consensus engine
3. [OpenAI API](https://platform.openai.com/docs/api-reference) — API compatibility target
4. [CosmJS](https://cosmos.github.io/cosmjs/) — JavaScript/TypeScript Cosmos SDK client

---

*Generated: 2026-04-04*
