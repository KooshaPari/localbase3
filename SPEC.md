# SPEC: LocalBase3 — Decentralized AI Compute Marketplace

## Meta

| Field | Value |
|-------|-------|
| **ID** | localbase-003 |
| **Title** | LocalBase3 Specification — Decentralized AI Compute Marketplace |
| **Created** | 2026-04-04 |
| **State** | specified |
| **Version** | 3.0.0 |
| **Languages** | TypeScript, Go (Cosmos SDK) |
| **Documentation Standard** | nanovms-level |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [System Components](#3-system-components)
4. [Data Models](#4-data-models)
5. [API Specification](#5-api-specification)
6. [Blockchain Layer](#6-blockchain-layer)
7. [Provider Node Software](#7-provider-node-software)
8. [Frontend Layer](#8-frontend-layer)
9. [Security Model](#9-security-model)
10. [Performance Targets](#10-performance-targets)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Integration Patterns](#12-integration-patterns)
13. [Testing Strategy](#13-testing-strategy)
14. [Operational Runbooks](#14-operational-runbooks)
15. [Dependencies and Tooling](#15-dependencies-and-tooling)
16. [References](#16-references)

---

## 1. Executive Summary

LocalBase3 is a decentralized AI compute marketplace that connects GPU owners (providers) with AI developers (consumers) through a blockchain-based coordination layer. The platform enables:

- **For Consumers**: Access to AI inference at 50-80% lower cost than centralized providers, with OpenAI-compatible API for seamless integration
- **For Providers**: Monetization of idle GPU resources through automated job matching and settlement
- **For the Network**: Decentralized coordination of compute resources with transparent reputation and fair payment mechanisms

**Key Differentiators:**
- OpenAI API compatibility (drop-in replacement)
- Cosmos SDK blockchain for fast, low-cost coordination
- Reputation-based provider quality assurance
- Real-time job matching with sub-5-second latency
- Multi-model support with automatic provider selection

**Target Users:**
- AI developers seeking cost-effective inference
- GPU owners with underutilized hardware
- Enterprises requiring private AI infrastructure
- Researchers needing scalable compute access

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              LocalBase3 Decentralized Architecture                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              Client Layer                                              │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│   │  │ Python SDK   │  │  Node.js SDK │  │  Go SDK      │  │  cURL/HTTP   │               │   │
│   │  │ (openai lib) │  │  (openai pkg)│  │  (client)    │  │  (direct)    │               │   │
│   │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │   │
│   └─────────┼─────────────────┼─────────────────┼─────────────────┼───────────────────────┘   │
│             │                 │                 │                 │                         │
│   ┌─────────┴─────────────────┴─────────────────┴─────────────────┴───────────────────────┐   │
│   │                              Load Balancer / CDN                                       │   │
│   │                    (DDoS protection, Geo-routing, SSL termination)                       │   │
│   └──────────────────────────────────────┬────────────────────────────────────────────────┘   │
│                                            │                                                │
│   ┌────────────────────────────────────────┴────────────────────────────────────────────────┐ │
│   │                              API Gateway Layer (localbase-api)                            │ │
│   │  ┌──────────────────────────────────────────────────────────────────────────────────┐   │ │
│   │  │                     OpenAI-Compatible REST API (Fastify)                            │   │ │
│   │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │ │
│   │  │  │ /v1/chat │ │ /v1/embed│ │ /v1/models│ │ /v1/providers│ │ /v1/jobs │ │ /v1/bids │   │   │ │
│   │  │  │/completions│ │  dings   │ │             │ │              │ │          │ │          │   │   │ │
│   │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │ │
│   │  │                                                                                   │   │ │
│   │  │  Components:                                                                      │   │ │
│   │  │  • Authentication (JWT/API Keys)                                                  │   │ │
│   │  │  • Rate Limiting (Redis-based)                                                    │   │ │
│   │  │  • Request Routing                                                                │   │ │
│   │  │  • Provider Selection Engine                                                      │   │ │
│   │  │  • Job Lifecycle Management                                                       │   │ │
│   │  └──────────────────────────────────────────────────────────────────────────────────┘   │ │
│   └────────────────────────────────────────┬────────────────────────────────────────────────┘ │
│                                            │                                                │
│   ┌────────────────────────────────────────┴────────────────────────────────────────────────┐ │
│   │                              Blockchain Layer (localbase-chain)                             │ │
│   │                    Cosmos SDK Application with Tendermint Consensus                         │ │
│   │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │ │
│   │  │ Provider Module │ │   Job Module    │ │ Payment Module  │ │ Reputation      │              │ │
│   │  │                 │ │                 │ │                 │ │   Module        │              │ │
│   │  │ • Registry      │ │ • Matching      │ │ • Escrow        │ │ • Scoring       │              │ │
│   │  │ • Benchmarks    │ │ • Scheduling    │ │ • Settlement    │ │ • History       │              │ │
│   │  │ • Pricing       │ │ • Tracking      │ │ • Disputes      │ │ • Updates       │              │ │
│   │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘              │ │
│   │                                                                                            │ │
│   │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                              │ │
│   │  │ Governance      │ │ Tokenomics      │ │ IBC Integration │                              │ │
│   │  │ Module          │ │ Module          │ │ (Cross-chain)   │                              │ │
│   │  └─────────────────┘ └─────────────────┘ └─────────────────┘                              │ │
│   └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                  │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                              Provider Software Layer (localbase-provider)                    │ │
│   │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │ │
│   │  │   Node Client   │ │  GPU Workload   │ │  Container      │ │  Blockchain     │           │ │
│   │  │                 │ │  Executor       │ │  Manager        │ │  Interface      │           │ │
│   │  │ • Discovery     │ │ • Model Loading │ │ • Docker/K8s    │ │ • Job Polling   │           │ │
│   │  │ • Heartbeat     │ │ • Inference     │ │ • Isolation     │ │ • Result Submit │           │ │
│   │  │ • Metrics       │ │ • Batching      │ │ • Monitoring    │ │ • Payment Claim │           │ │
│   │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘           │ │
│   │                                                                                             │ │
│   │  ┌─────────────────┐ ┌─────────────────┐                                                   │ │
│   │  │ Model Registry    │ │  Security       │                                                   │ │
│   │  │ (ONNX, PyTorch)   │ │  Manager        │                                                   │ │
│   │  └─────────────────┘ └─────────────────┘                                                   │ │
│   └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Diagrams

**Job Submission Flow:**
```
Consumer              API Gateway          Job Router         Blockchain         Provider
   │                       │                    │                   │                │
   │ POST /v1/chat/completions                 │                   │                │
   │──────────────────────▶│                   │                   │                │
   │                       │                   │                   │                │
   │                       │ Create Job Request│                   │                │
   │                       │──────────────────▶│                   │                │
   │                       │                   │                   │                │
   │                       │                   │ Select Provider   │                │
   │                       │◀─────────────────│                   │                │
   │                       │                   │                   │                │
   │                       │                   │   Create Escrow   │                │
   │                       │                   │──────────────────▶│                │
   │                       │                   │                   │                │
   │                       │                   │   Assign Job      │                │
   │                       │                   │──────────────────▶│               │
   │                       │                   │                   │                │
   │                       │                   │                   │   Execute Job  │
   │                       │                   │                   │◀───────────────│
   │                       │                   │                   │                │
   │                       │                   │   Submit Result   │                │
   │                       │                   │◀──────────────────│                │
   │                       │                   │                   │                │
   │                       │                   │   Release Escrow  │                │
   │                       │                   │──────────────────▶│                │
   │                       │                   │                   │                │
   │   Return Response     │                   │                   │                │
   │◀──────────────────────│                   │                   │                │
   │                       │                   │                   │                │
```

**Streaming Inference Flow:**
```
Consumer              API Gateway          Provider Node
   │                       │                    │
   │ POST /v1/chat/completions (stream=true)     │
   │──────────────────────▶│                    │
   │                       │ Establish SSE      │
   │                       │──────────────────▶│
   │                       │                    │
   │                       │   Stream Tokens    │
   │   data: {"token":...} │◀───────────────────│
   │◀──────────────────────│                    │
   │                       │   Stream Tokens    │
   │   data: {"token":...} │◀───────────────────│
   │◀──────────────────────│                    │
   │                       │        ...         │
   │                       │                    │
   │                       │   [DONE]           │
   │   data: [DONE]        │◀───────────────────│
   │◀──────────────────────│                    │
   │                       │                    │
```

### 2.3 Component Interactions

**Synchronous Interactions:**
| Source | Destination | Protocol | Purpose | Latency Target |
|--------|-------------|----------|---------|----------------|
| Client | API Gateway | HTTPS/REST | Job submission | <200ms p95 |
| API Gateway | Provider | HTTP/gRPC | Job execution | <5s (inference time) |
| API Gateway | Blockchain | gRPC/Tendermint | State queries | <100ms |
| Provider | Blockchain | gRPC/Tendermint | Job polling | <1s |

**Asynchronous Interactions:**
| Source | Destination | Protocol | Purpose |
|--------|-------------|----------|---------|
| Blockchain | API Gateway | WebSocket/Events | State changes |
| Provider | Monitoring | OTel/Metrics | Health metrics |
| API Gateway | Queue | Redis Pub/Sub | Job distribution |

---

## 3. System Components

### 3.1 Component Table

| Component | Path | Language | Lines of Code | Responsibility | Status |
|-----------|------|----------|---------------|----------------|--------|
| **Frontend** | `localbase-frontend/` | TypeScript/Next.js | ~15,000 | User interface, dashboards, wallet integration | Active |
| **API Gateway** | `localbase-api/` | TypeScript/Node.js | ~12,000 | OpenAI-compatible REST API, job routing | Active |
| **Blockchain** | `localbase-chain/` | Go/Cosmos SDK | ~25,000 | Consensus, modules, state management | Active |
| **Provider** | `localbase-provider/` | TypeScript/Node.js | ~10,000 | Provider node software, GPU execution | Active |
| **Tests** | `localbase-tests/` | TypeScript | ~8,000 | Integration, E2E, security tests | Active |
| **Docs** | `localbase-docs/` | Markdown | ~5,000 | Documentation site (VitePress) | Active |

### 3.2 Frontend Architecture

**Technology Stack:**
- Framework: Next.js 14 (App Router)
- Language: TypeScript 5.x
- Styling: Tailwind CSS + shadcn/ui
- State: React Query + Zustand
- Wallet: Keplr Wallet (Cosmos)
- Charts: Recharts
- Testing: Jest + Cypress

**Directory Structure:**
```
localbase-frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── provider/         # Provider dashboard
│   │   ├── consumer/         # Consumer portal
│   │   └── admin/            # Admin panel
│   ├── api/                  # API routes
│   ├── auth/                 # Authentication pages
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── provider/             # Provider-specific components
│   ├── consumer/             # Consumer-specific components
│   └── shared/               # Shared components
├── hooks/
│   ├── useBlockchain.ts      # Cosmos SDK integration
│   ├── useProvider.ts        # Provider management
│   └── useJobs.ts            # Job lifecycle
├── lib/
│   ├── supabase.ts           # Database client
│   ├── blockchain.ts         # Chain interaction
│   └── utils.ts              # Utilities
└── types/
    ├── provider.ts
    ├── job.ts
    └── blockchain.ts
```

**Key Frontend Features:**
1. **Provider Dashboard**: Real-time GPU metrics, earnings tracking, job history
2. **Consumer Portal**: API key management, usage analytics, billing
3. **Marketplace Explorer**: Provider discovery, comparison, reputation scores
4. **Wallet Integration**: Keplr wallet for on-chain transactions

### 3.3 API Gateway Architecture

**Core Responsibilities:**
1. OpenAI API compatibility layer
2. Authentication and authorization
3. Rate limiting and quota enforcement
4. Provider selection and job routing
5. Request/response transformation
6. Streaming support (SSE)

**Request Processing Pipeline:**
```go
// Request Flow
Client Request
  ↓
Authentication Middleware (JWT/API Key)
  ↓
Rate Limiting (Redis-based token bucket)
  ↓
Request Validation (Zod schemas)
  ↓
Request Transformation (OpenAI → LocalBase)
  ↓
Provider Selection Engine
  ↓
Job Creation & Escrow
  ↓
Provider Communication
  ↓
Response Aggregation
  ↓
Response Transformation (LocalBase → OpenAI)
  ↓
Client Response
```

**Key API Gateway Components:**

```typescript
// Authentication Service
class AuthService {
  async validateAPIKey(apiKey: string): Promise<APIKeyValidation>
  async generateAPIKey(userId: string, permissions: Permission[]): Promise<APIKey>
  async revokeAPIKey(apiKey: string): Promise<void>
  async rotateAPIKey(apiKey: string): Promise<APIKey>
}

// Rate Limiting Service
class RateLimitService {
  async checkLimit(apiKey: string, endpoint: string): Promise<RateLimitStatus>
  async consumeTokens(apiKey: string, tokens: number): Promise<void>
  async getUsageStats(apiKey: string, period: TimeRange): Promise<UsageStats>
}

// Provider Selection Engine
class ProviderSelectionEngine {
  async selectProvider(job: JobRequest): Promise<Provider>
  async getEligibleProviders(job: JobRequest): Promise<Provider[]>
  async calculateProviderScore(provider: Provider, job: JobRequest): Promise<number>
  async updateProviderWeights(weights: ProviderWeights): Promise<void>
}

// Job Router
class JobRouter {
  async routeJob(job: JobRequest): Promise<JobResult>
  async streamJob(job: JobRequest, response: Response): Promise<void>
  async handleJobFailure(job: Job, error: Error): Promise<JobResult>
  async retryJob(job: Job): Promise<JobResult>
}
```

### 3.4 Blockchain Architecture

**Module Organization:**
```
localbase-chain/
├── app/
│   ├── app.go               # App initialization
│   ├── export.go            # State export
│   ├── genesis.go           # Genesis handling
│   └── encoding.go          # Codec configuration
├── x/                        # Custom modules
│   ├── provider/            # Provider registry
│   │   ├── keeper/
│   │   ├── types/
│   │   ├── client/
│   │   └── spec/
│   ├── job/                 # Job lifecycle
│   ├── payment/             # Escrow and settlement
│   ├── reputation/          # Provider reputation
│   ├── governance/          # Protocol governance
│   └── tokenomics/          # Inflation and rewards
├── proto/                    # Protobuf definitions
│   ├── localbase/
│   │   ├── provider/
│   │   ├── job/
│   │   └── ...
│   └── buf.yaml
├── proto-gen/               # Generated code
└── testutil/                # Test helpers
```

**Module Interactions:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Provider   │────▶│     Job     │────▶│   Payment   │
│   Module    │◀────│   Module    │◀────│   Module    │
└──────┬──────┘     └──────┬──────┘     └─────────────┘
       │                   │
       │            ┌──────┴──────┐
       └───────────▶│  Reputation │
                    │   Module    │
                    └─────────────┘
```

### 3.5 Provider Node Architecture

**Core Subsystems:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Provider Node                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐   ┌─────────────────┐                   │
│  │  Heartbeat      │   │  Job Executor   │                   │
│  │  Service        │   │                 │                   │
│  │                 │   │ • vLLM runtime  │                   │
│  │ • Status ping   │   │ • Model loading │                   │
│  │ • Metrics send  │   │ • Batching      │                   │
│  │ • Discovery     │   │ • Quantization  │                   │
│  └────────┬────────┘   └────────┬────────┘                   │
│           │                      │                          │
│           │             ┌────────┴────────┐                  │
│           │             │                 │                  │
│           │      ┌──────▼──────┐  ┌──────▼──────┐           │
│           │      │  Container  │  │   Model     │           │
│           │      │   Engine    │  │   Cache     │           │
│           │      │             │  │             │           │
│           │      │ • Docker    │  │ • ONNX      │           │
│           │      │ • NVIDIA    │  │ • PyTorch   │           │
│           │      │   Container │  │ • TensorFlow│           │
│           │      │   Toolkit   │  │             │           │
│           │      └─────────────┘  └─────────────┘           │
│           │                                                 │
│  ┌────────┴──────────────────────────────────────────────┐  │
│  │                   Blockchain Client                      │  │
│  │  • Job polling    • Result submission   • Payment claim │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Data Models

### 4.1 Core Entities

**Provider:**
```go
// Cosmos SDK type
type Provider struct {
    ID                  string            `json:"id"`
    Owner               sdk.AccAddress    `json:"owner"`
    Name                string            `json:"name"`
    Description         string            `json:"description"`
    HardwareInfo        HardwareInfo      `json:"hardware_info"`
    BenchmarkResults    BenchmarkResults  `json:"benchmark_results"`
    ModelsSupported     []string          `json:"models_supported"`
    Pricing             map[string]Pricing `json:"pricing"`
    Status              ProviderStatus    `json:"status"`
    Region              string            `json:"region"`
    EndpointURL         string            `json:"endpoint_url"`
    Reputation          sdk.Dec           `json:"reputation"`
    TotalJobsCompleted  uint64            `json:"total_jobs_completed"`
    TotalEarnings       sdk.Coins         `json:"total_earnings"`
    Stake               sdk.Coins         `json:"stake"`
    CreatedAt           int64             `json:"created_at"`
    UpdatedAt           int64             `json:"updated_at"`
    LastActiveAt        int64             `json:"last_active_at"`
}

type HardwareInfo struct {
    GPUType         string `json:"gpu_type"`         // e.g., "NVIDIA RTX 4090"
    VRAM            uint64 `json:"vram"`             // In MB
    CUDACompute     uint32 `json:"cuda_compute"`     // Compute capability
    CPUCores        uint32 `json:"cpu_cores"`
    RAM             uint64 `json:"ram"`              // In MB
    Storage         uint64 `json:"storage"`            // In GB
    NetworkSpeed    uint64 `json:"network_speed"`      // In Mbps
}

type BenchmarkResults struct {
    InferenceSpeedTokensPerSec float64 `json:"inference_speed_tokens_per_sec"`
    MaxBatchSize               uint32  `json:"max_batch_size"`
    LatencyP50                 uint32  `json:"latency_p50_ms"`
    LatencyP95                 uint32  `json:"latency_p95_ms"`
    LatencyP99                 uint32  `json:"latency_p99_ms"`
    BenchmarkedAt              int64   `json:"benchmarked_at"`
}

type Pricing struct {
    InputPricePerToken  sdk.Dec `json:"input_price_per_token"`  // In LB
    OutputPricePerToken sdk.Dec `json:"output_price_per_token"` // In LB
}

type ProviderStatus string

const (
    ProviderStatusActive   ProviderStatus = "active"
    ProviderStatusInactive ProviderStatus = "inactive"
    ProviderStatusPending  ProviderStatus = "pending"
    ProviderStatusSuspended ProviderStatus = "suspended"
    ProviderStatusSlashed  ProviderStatus = "slashed"
)
```

**Job:**
```go
type Job struct {
    ID                string         `json:"id"`
    Creator           sdk.AccAddress `json:"creator"`
    ProviderID        string         `json:"provider_id"`
    Model             string         `json:"model"`
    Input             string         `json:"input"`              // Encrypted or IPFS hash
    InputHash         string         `json:"input_hash"`
    Output            string         `json:"output"`             // Result or IPFS hash
    OutputHash        string         `json:"output_hash"`
    Status            JobStatus      `json:"status"`
    MaxTokens         uint32         `json:"max_tokens"`
    Temperature       sdk.Dec        `json:"temperature"`
    TopP              sdk.Dec        `json:"top_p"`
    CreatedAt         int64          `json:"created_at"`
    AssignedAt        *int64         `json:"assigned_at,omitempty"`
    StartedAt         *int64         `json:"started_at,omitempty"`
    CompletedAt       *int64         `json:"completed_at,omitempty"`
    Payment           PaymentInfo    `json:"payment"`
    Usage             UsageStats     `json:"usage"`
    Error             *JobError      `json:"error,omitempty"`
}

type JobStatus string

const (
    JobStatusPending    JobStatus = "pending"
    JobStatusAssigned   JobStatus = "assigned"
    JobStatusRunning    JobStatus = "running"
    JobStatusCompleted  JobStatus = "completed"
    JobStatusFailed     JobStatus = "failed"
    JobStatusCancelled  JobStatus = "cancelled"
    JobStatusDisputed   JobStatus = "disputed"
)

type PaymentInfo struct {
    EscrowID       string    `json:"escrow_id"`
    Amount         sdk.Coins `json:"amount"`
    Released       bool      `json:"released"`
    ReleasedAt     *int64    `json:"released_at,omitempty"`
}

type UsageStats struct {
    PromptTokens     uint32 `json:"prompt_tokens"`
    CompletionTokens uint32 `json:"completion_tokens"`
    TotalTokens      uint32 `json:"total_tokens"`
    ProcessingTimeMs uint32 `json:"processing_time_ms"`
}

type JobError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}
```

**Escrow:**
```go
type Escrow struct {
    ID            string         `json:"id"`
    JobID         string         `json:"job_id"`
    Consumer      sdk.AccAddress `json:"consumer"`
    Provider      sdk.AccAddress `json:"provider"`
    Amount        sdk.Coins      `json:"amount"`
    Status        EscrowStatus   `json:"status"`
    CreatedAt     int64          `json:"created_at"`
    ReleasedAt    *int64         `json:"released_at,omitempty"`
    RefundedAt    *int64         `json:"refunded_at,omitempty"`
    DisputeID     *string        `json:"dispute_id,omitempty"`
}

type EscrowStatus string

const (
    EscrowStatusPending   EscrowStatus = "pending"
    EscrowStatusReleased EscrowStatus = "released"
    EscrowStatusRefunded EscrowStatus = "refunded"
    EscrowStatusDisputed EscrowStatus = "disputed"
)
```

**Reputation:**
```go
type Reputation struct {
    ProviderID      string          `json:"provider_id"`
    OverallScore    sdk.Dec         `json:"overall_score"`
    QualityScore    sdk.Dec         `json:"quality_score"`
    SpeedScore      sdk.Dec         `json:"speed_score"`
    ReliabilityScore sdk.Dec        `json:"reliability_score"`
    ConsistencyScore sdk.Dec         `json:"consistency_score"`
    TotalRatings    uint64          `json:"total_ratings"`
    History         []ReputationUpdate `json:"history"`
    UpdatedAt       int64           `json:"updated_at"`
}

type ReputationUpdate struct {
    JobID       string    `json:"job_id"`
    ConsumerID  string    `json:"consumer_id"`
    Rating      sdk.Dec   `json:"rating"`  // 0-1
    Timestamp   int64     `json:"timestamp"`
    Feedback    string    `json:"feedback,omitempty"`
}
```

### 4.2 Database Schema (PostgreSQL)

**Job Table:**
```sql
CREATE TABLE jobs (
    id VARCHAR(64) PRIMARY KEY,
    creator VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64),
    model VARCHAR(64) NOT NULL,
    input_hash VARCHAR(64),
    output_hash VARCHAR(64),
    status VARCHAR(32) NOT NULL,
    max_tokens INTEGER,
    temperature DECIMAL(3,2),
    top_p DECIMAL(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    payment_amount BIGINT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    processing_time_ms INTEGER,
    error_code VARCHAR(32),
    error_message TEXT,
    
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE INDEX idx_jobs_creator ON jobs(creator, created_at DESC);
CREATE INDEX idx_jobs_provider ON jobs(provider_id, status, created_at);
CREATE INDEX idx_jobs_status ON jobs(status, model, created_at) WHERE status = 'pending';
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
```

**Provider Table:**
```sql
CREATE TABLE providers (
    id VARCHAR(64) PRIMARY KEY,
    owner VARCHAR(64) NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    gpu_type VARCHAR(64),
    vram_mb BIGINT,
    cpu_cores INTEGER,
    ram_mb BIGINT,
    endpoint_url VARCHAR(256),
    status VARCHAR(32) NOT NULL,
    region VARCHAR(64),
    reputation DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    total_jobs_completed BIGINT DEFAULT 0,
    total_earnings BIGINT DEFAULT 0,
    stake BIGINT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP
);

CREATE INDEX idx_providers_status ON providers(status, reputation DESC) WHERE status = 'active';
CREATE INDEX idx_providers_region ON providers(region, status, reputation DESC);
```

---

## 5. API Specification

### 5.1 OpenAI-Compatible Endpoints

**List Models:**
```
GET /v1/models

Response:
{
  "object": "list",
  "data": [
    {
      "id": "lb-llama-3-70b",
      "object": "model",
      "created": 1698969600,
      "owned_by": "localbase",
      "permission": [],
      "root": "llama-3-70b",
      "parent": null,
      "providers": [
        {
          "id": "provider_1",
          "reputation": 0.98,
          "price_per_token": 0.00000005,
          "avg_response_time": 150,
          "region": "us-west"
        }
      ]
    }
  ]
}
```

**Chat Completions:**
```
POST /v1/chat/completions

Request:
{
  "model": "lb-llama-3-70b",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 150,
  "stream": false,
  "provider_preferences": {
    "min_reputation": 0.9,
    "max_price_per_token": 0.0000001,
    "region": "us-west"
  }
}

Response:
{
  "id": "chatcmpl-123456789",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "lb-llama-3-70b",
  "provider_id": "provider_1",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 30,
    "total_tokens": 50
  }
}
```

**Streaming Chat Completions:**
```
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "lb-llama-3-70b",
  "messages": [{"role": "user", "content": "Tell me a story"}],
  "stream": true
}

Response (Server-Sent Events):
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1699000000,"model":"lb-llama-3-70b","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1699000000,"model":"lb-llama-3-70b","choices":[{"index":0,"delta":{"content":"Once"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1699000000,"model":"lb-llama-3-70b","choices":[{"index":0,"delta":{"content":" upon"},"finish_reason":null}]}

... (continues until finish_reason: "stop")

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1699000000,"model":"lb-llama-3-70b","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### 5.2 LocalBase Extensions

**List Providers:**
```
GET /v1/providers?model=lb-llama-3-70b&min_reputation=0.9&region=us-west

Response:
{
  "object": "list",
  "data": [
    {
      "id": "provider_1",
      "object": "provider",
      "created": 1698969600,
      "hardware": {
        "gpu_type": "NVIDIA RTX 4090",
        "vram": "24GB",
        "cpu_cores": 16,
        "ram": "64GB"
      },
      "benchmark_results": {
        "inference_speed_tokens_per_sec": 45.2,
        "max_batch_size": 16,
        "latency_p50_ms": 120,
        "latency_p95_ms": 250
      },
      "reputation": 0.98,
      "models_supported": ["lb-llama-3-70b", "lb-mixtral-8x7b"],
      "pricing": {
        "lb-llama-3-70b": {
          "input_price_per_token": 0.00000002,
          "output_price_per_token": 0.00000005
        }
      },
      "status": "active",
      "region": "us-west",
      "performance_history": {
        "uptime_percentage": 99.8,
        "completed_jobs_24h": 15420,
        "avg_response_time_ms": 150
      }
    }
  ]
}
```

**Get Provider:**
```
GET /v1/providers/{provider_id}
```

**List Jobs:**
```
GET /v1/jobs?status=completed&limit=10

Response:
{
  "object": "list",
  "data": [
    {
      "id": "job_123456789",
      "object": "job",
      "created": 1699000000,
      "model": "lb-llama-3-70b",
      "provider_id": "provider_1",
      "status": "completed",
      "cost": {
        "input_tokens": 20,
        "output_tokens": 30,
        "input_cost": 0.0000004,
        "output_cost": 0.0000015,
        "total_cost": 0.0000019
      },
      "completion_time": 1699000010
    }
  ],
  "has_more": true,
  "next_cursor": "job_123456788"
}
```

**Request Bids:**
```
POST /v1/bids

Request:
{
  "model": "lb-llama-3-70b",
  "messages": [{"role": "user", "content": "Generate a 1000-word essay"}],
  "max_tokens": 1500,
  "bid_timeout_seconds": 30
}

Response:
{
  "bids": [
    {
      "provider_id": "provider_1",
      "estimated_cost": 0.00015,
      "estimated_completion_time_ms": 3500,
      "reputation": 0.98,
      "bid_id": "bid_123456789",
      "expires_at": 1699000030
    },
    {
      "provider_id": "provider_2",
      "estimated_cost": 0.00012,
      "estimated_completion_time_ms": 4200,
      "reputation": 0.95,
      "bid_id": "bid_987654321",
      "expires_at": 1699000030
    }
  ]
}
```

**Accept Bid:**
```
POST /v1/bids/{bid_id}/accept

Response:
{
  "id": "chatcmpl-123456789",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "lb-llama-3-70b",
  "provider_id": "provider_2",
  ...
}
```

### 5.3 Error Codes

| HTTP Status | Type | Code | Description |
|-------------|------|------|-------------|
| 400 | invalid_request_error | invalid_model | Model not found |
| 400 | invalid_request_error | invalid_provider | Provider not found or inactive |
| 401 | authentication_error | invalid_api_key | Invalid or revoked API key |
| 401 | authentication_error | insufficient_funds | Account balance too low |
| 429 | rate_limit_error | rate_limit_exceeded | Too many requests |
| 429 | rate_limit_error | quota_exceeded | Token quota exceeded |
| 500 | service_unavailable | provider_unavailable | No eligible providers |
| 500 | service_unavailable | job_timeout | Job exceeded timeout |
| 500 | provider_error | inference_failed | Provider execution error |

---

## 6. Blockchain Layer

### 6.1 Consensus Configuration

**Tendermint Parameters:**
```toml
[consensus]
# Block production
consensus.create_empty_blocks = true
consensus.create_empty_blocks_interval = "5s"

# Timeout configuration
consensus.timeout_propose = "3s"
consensus.timeout_propose_delta = "500ms"
consensus.timeout_prevote = "1s"
consensus.timeout_prevote_delta = "500ms"
consensus.timeout_precommit = "1s"
consensus.timeout_precommit_delta = "500ms"
consensus.timeout_commit = "5s"

# Block size
consensus.max_block_size_bytes = 2000000
consensus.max_gas = 20000000
consensus.max_txs = 10000
```

**Tokenomics Parameters:**
```go
type TokenomicsParams struct {
    // Inflation
    InflationRateChange sdk.Dec  // Annual inflation rate change
    InflationMax        sdk.Dec  // Maximum inflation (8%)
    InflationMin        sdk.Dec  // Minimum inflation (2%)
    
    // Staking
    GoalBonded          sdk.Dec  // Target bonded ratio (67%)
    BlocksPerYear       uint64   // Expected blocks per year (6s block time = 5,256,000)
    
    // Distribution
    CommunityTax        sdk.Dec  // Tax to community pool (2%)
    BaseProposerReward  sdk.Dec  // Base proposer bonus (1%)
    BonusProposerReward sdk.Dec  // Bonus proposer reward (4%)
    
    // Provider incentives
    ProviderRewardRate  sdk.Dec  // Additional provider incentives (5% of inflation)
    ValidatorRewardRate sdk.Dec  // Validator rewards (85% of inflation)
}
```

### 6.2 Module Specifications

**Provider Module:**
```protobuf
// proto/localbase/provider/tx.proto
syntax = "proto3";
package localbase.provider;

message MsgRegisterProvider {
  string creator = 1;
  string name = 2;
  string description = 3;
  HardwareInfo hardware_info = 4;
  repeated string models_supported = 5;
  map<string, Pricing> pricing = 6;
  string region = 7;
  string endpoint_url = 8;
}

message MsgUpdateProvider {
  string creator = 1;
  string id = 2;
  string name = 3;
  string description = 4;
  repeated string models_supported = 5;
  map<string, Pricing> pricing = 6;
  string endpoint_url = 7;
}

message MsgDeregisterProvider {
  string creator = 1;
  string id = 2;
}
```

**Job Module:**
```protobuf
// proto/localbase/job/tx.proto
syntax = "proto3";
package localbase.job;

message MsgCreateJob {
  string creator = 1;
  string model = 2;
  string input = 3;           // Encrypted or IPFS hash
  uint32 max_tokens = 4;
  string temperature = 5;     // sdk.Dec as string
  string top_p = 6;
  string provider_id = 7;     // Optional: preferred provider
  repeated string excluded_providers = 8;
  string min_reputation = 9;
  string max_price = 10;
}

message MsgAssignJob {
  string creator = 1;        // API gateway authority
  string job_id = 2;
  string provider_id = 3;
}

message MsgCompleteJob {
  string creator = 1;        // Provider address
  string job_id = 2;
  string output = 3;         // Result or IPFS hash
  uint32 prompt_tokens = 4;
  uint32 completion_tokens = 5;
  uint32 processing_time_ms = 6;
}

message MsgFailJob {
  string creator = 1;
  string job_id = 2;
  string error_code = 3;
  string error_message = 4;
}
```

**Payment Module:**
```protobuf
// proto/localbase/payment/tx.proto
syntax = "proto3";
package localbase.payment;

message MsgCreateEscrow {
  string creator = 1;
  string job_id = 2;
  string provider = 3;
  repeated cosmos.base.v1beta1.Coin amount = 4;
}

message MsgReleaseEscrow {
  string creator = 1;
  string escrow_id = 2;
}

message MsgRefundEscrow {
  string creator = 1;
  string escrow_id = 2;
  string reason = 3;
}
```

### 6.3 Transaction Fees

**Fee Schedule:**
| Transaction Type | Gas Units | Fee (LB) | Notes |
|------------------|-----------|----------|-------|
| Provider Registration | 100,000 | 0.1 | Includes deposit |
| Provider Update | 50,000 | 0.05 | |
| Job Creation | 30,000 | 0.03 | Base fee |
| Job Assignment | 20,000 | 0.02 | By gateway |
| Job Completion | 40,000 | 0.04 | By provider |
| Escrow Creation | 25,000 | 0.025 | |
| Escrow Release | 15,000 | 0.015 | |
| Governance Vote | 10,000 | 0.01 | |

---

## 7. Provider Node Software

### 7.1 Configuration

**Provider Node Config (YAML):**
```yaml
# provider-config.yaml
provider:
  name: "My GPU Provider"
  description: "High-performance inference node"
  contact_email: "admin@example.com"
  region: "us-west-1"

blockchain:
  chain_id: "localbase-1"
  rpc_endpoint: "https://rpc.localbase.network:26657"
  grpc_endpoint: "https://grpc.localbase.network:9090"
  wallet_path: "/etc/localbase/wallet.json"
  wallet_password: "${WALLET_PASSWORD}"
  gas_prices: "0.025ulb"
  gas_adjustment: 1.5

hardware:
  gpu_device_ids: ["0", "1"]  # Use GPUs 0 and 1
  gpu_memory_utilization: 0.9
  max_temperature_celsius: 85
  cpu_cores: 8
  ram_gb: 32

models:
  storage_path: "/var/localbase/models"
  cache_size_gb: 100
  preloaded_models:
    - "lb-llama-3-70b"
    - "lb-mixtral-8x7b"
  trusted_sources:
    - "https://models.localbase.network"
    - "https://huggingface.co"

inference:
  backend: "vllm"  # or "tensorrt-llm", "onnxruntime"
  max_batch_size: 16
  max_concurrent_requests: 32
  quantization: "awq"  # or "gptq", "fp16", "int8"
  tensor_parallel_size: 1
  pipeline_parallel_size: 1

container:
  runtime: "docker"  # or "kubernetes", "native"
  image: "localbase/provider-inference:latest"
  network_mode: "host"
  ipc_mode: "host"
  shm_size: "8gb"

monitoring:
  enabled: true
  metrics_port: 8080
  health_check_interval: "30s"
  otel_endpoint: "https://otel.localbase.network"
  
pricing:
  default_input_price: "0.00000002"   # In LB
  default_output_price: "0.00000005"  # In LB
  currency: "ulb"
  minimum_job_price: "0.0001"
  model_specific:
    lb-llama-3-70b:
      input_price: "0.00000003"
      output_price: "0.00000007"

security:
  max_input_tokens: 8192
  max_output_tokens: 4096
  rate_limit_per_minute: 1000
  enable_firewall: true
  allowed_origins:
    - "https://api.localbase.network"

logging:
  level: "info"
  format: "json"
  file: "/var/log/localbase/provider.log"
  max_size_mb: 100
  max_backups: 10
  max_age_days: 30
```

### 7.2 Job Execution Flow

```go
func (p *Provider) ExecuteJob(job blockchain.Job) (*ExecutionResult, error) {
    // 1. Validate job
    if err := p.validateJob(job); err != nil {
        return nil, fmt.Errorf("job validation failed: %w", err)
    }
    
    // 2. Check model availability
    model, err := p.modelRegistry.GetModel(job.Model)
    if err != nil {
        return nil, fmt.Errorf("model not available: %w", err)
    }
    
    // 3. Load/create container
    container, err := p.containerManager.GetContainer(job.Model, model.Version)
    if err != nil {
        return nil, fmt.Errorf("container error: %w", err)
    }
    
    // 4. Prepare input
    input, err := p.prepareInput(job)
    if err != nil {
        return nil, fmt.Errorf("input preparation failed: %w", err)
    }
    
    // 5. Execute inference
    ctx, cancel := context.WithTimeout(context.Background(), time.Duration(job.MaxTokens)*100*time.Millisecond)
    defer cancel()
    
    startTime := time.Now()
    output, err := container.Execute(ctx, input)
    processingTime := time.Since(startTime)
    
    if err != nil {
        return nil, fmt.Errorf("inference failed: %w", err)
    }
    
    // 6. Calculate token usage
    usage := &UsageStats{
        PromptTokens:     countTokens(input),
        CompletionTokens: countTokens(output),
        TotalTokens:      countTokens(input) + countTokens(output),
        ProcessingTime: uint32(processingTime.Milliseconds()),
    }
    
    // 7. Submit result
    return &ExecutionResult{
        Output:    output,
        Usage:     usage,
        OutputHash: sha256.Sum256([]byte(output)),
    }, nil
}
```

### 7.3 Health Monitoring

**Metrics Exported:**
```go
type ProviderMetrics struct {
    // GPU metrics
    GPUUtilization    prometheus.Gauge
    GPUMemoryUsed     prometheus.Gauge
    GPUMemoryTotal    prometheus.Gauge
    GPUTemperature    prometheus.Gauge
    
    // Job metrics
    JobsCompleted     prometheus.Counter
    JobsFailed        prometheus.Counter
    JobDuration       prometheus.Histogram
    TokensProcessed   prometheus.Counter
    
    // Financial metrics
    EarningsTotal     prometheus.Counter
    EarningsPerHour   prometheus.Gauge
    
    // Network metrics
    ResponseTime      prometheus.Histogram
    ActiveConnections prometheus.Gauge
}

func (p *Provider) recordMetrics() {
    go func() {
        ticker := time.NewTicker(30 * time.Second)
        defer ticker.Stop()
        
        for range ticker.C {
            // GPU metrics
            util, _ := p.gpuMonitor.GetUtilization()
            p.metrics.GPUUtilization.Set(float64(util))
            
            memUsed, memTotal, _ := p.gpuMonitor.GetMemory()
            p.metrics.GPUMemoryUsed.Set(float64(memUsed))
            p.metrics.GPUMemoryTotal.Set(float64(memTotal))
            
            // Job throughput
            p.metrics.TokensProcessed.Add(float64(p.stats.TokensSinceLastReport))
            p.stats.TokensSinceLastReport = 0
        }
    }()
}
```

---

## 8. Frontend Layer

### 8.1 Page Structure

**Consumer Portal:**
```
/consumer
├── /dashboard              # Overview, usage stats, quick actions
├── /api-keys               # API key management
├── /jobs                   # Job history and monitoring
├── /billing                # Usage, invoices, payment methods
├── /models                 # Available models and providers
└── /settings               # Account settings
```

**Provider Dashboard:**
```
/provider
├── /dashboard              # Performance metrics, earnings
├── /hardware               # GPU monitoring and management
├── /jobs                   # Active and completed jobs
├── /earnings               # Revenue tracking and withdrawals
├── /models                 # Model configuration
├── /reputation             # Ratings and feedback
└── /settings               # Node configuration
```

**Admin Panel:**
```
/admin
├── /overview               # Network statistics
├── /providers              # Provider management
├── /jobs                 # Global job monitoring
├── /governance           # Proposal management
├── /treasury             # Treasury and funding
└── /settings             # Protocol parameters
```

### 8.2 Component Specifications

**Job Status Badge:**
```typescript
interface JobStatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
}

const statusConfig = {
  pending: { color: 'yellow', icon: Clock, label: 'Pending' },
  assigned: { color: 'blue', icon: UserCheck, label: 'Assigned' },
  running: { color: 'blue', icon: Loader2, label: 'Running', animate: true },
  completed: { color: 'green', icon: CheckCircle, label: 'Completed' },
  failed: { color: 'red', icon: XCircle, label: 'Failed' },
  cancelled: { color: 'gray', icon: Ban, label: 'Cancelled' },
} as const;
```

**Provider Card:**
```typescript
interface ProviderCardProps {
  provider: Provider;
  showPricing?: boolean;
  showActions?: boolean;
  onSelect?: (provider: Provider) => void;
}

// Displays:
// - Provider name and reputation score
// - GPU specs (type, VRAM)
// - Performance metrics (latency, throughput)
// - Supported models
// - Pricing (if enabled)
// - Region indicator
// - Status badge
// - Select button (if showActions)
```

---

## 9. Security Model

### 9.1 Threat Model

**Threat Actors:**
1. **Malicious Provider**: Returns incorrect results, steals models, DDoS
2. **Malicious Consumer**: Attempts to extract models, wastes provider resources
3. **Network Attacker**: MITM, replay attacks, eclipse attacks
4. **Insider**: API gateway compromise, database breach
5. **Competitor**: Sybil attack, reputation manipulation

**Assets:**
1. AI models (intellectual property)
2. Job inputs/outputs (user data)
3. Provider reputation (economic value)
4. Funds in escrow (financial value)
5. Network availability (operational value)

### 9.2 Security Controls

**Input Validation:**
```go
func (k msgServer) CreateJob(ctx context.Context, msg *MsgCreateJob) (*MsgCreateJobResponse, error) {
    // Validate input size
    if len(msg.Input) > MaxInputSize {
        return nil, sdkerrors.Wrap(ErrInputTooLarge, "input exceeds maximum size")
    }
    
    // Validate model exists
    if !k.modelKeeper.IsValidModel(msg.Model) {
        return nil, sdkerrors.Wrapf(ErrInvalidModel, "model %s not found", msg.Model)
    }
    
    // Validate parameters
    if msg.Temperature.LT(sdk.ZeroDec()) || msg.Temperature.GT(sdk.NewDec(2)) {
        return nil, sdkerrors.Wrap(ErrInvalidTemperature, "temperature must be between 0 and 2")
    }
    
    // ...
}
```

**Rate Limiting:**
```typescript
class RateLimiter {
  private redis: Redis;
  
  async checkLimit(key: string, limit: number, window: number): Promise<boolean> {
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return current <= limit;
  }
  
  // Token bucket for burst handling
  async consumeToken(key: string, burstSize: number, refillRate: number): Promise<boolean> {
    const lua = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local burst = tonumber(ARGV[2])
      local rate = tonumber(ARGV[3])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or burst
      local last_refill = tonumber(bucket[2]) or now
      
      local delta = math.min(burst, tokens + (now - last_refill) * rate)
      
      if delta >= 1 then
        redis.call('HMSET', key, 'tokens', delta - 1, 'last_refill', now)
        redis.call('EXPIRE', key, 3600)
        return 1
      else
        redis.call('HMSET', key, 'tokens', delta, 'last_refill', now)
        return 0
      end
    `;
    
    const result = await this.redis.eval(lua, 1, key, Date.now(), burstSize, refillRate);
    return result === 1;
  }
}
```

**Provider Authentication:**
```go
type ProviderAuth struct {
    NodeID       string
    PrivateKey   crypto.PrivKey
    Certificate  *x509.Certificate
}

func (p *Provider) AuthenticateRequest(req *http.Request) error {
    // Extract certificate from TLS connection
    cert := req.TLS.PeerCertificates[0]
    
    // Verify certificate chain
    if err := verifyCertificateChain(cert); err != nil {
        return fmt.Errorf("invalid certificate: %w", err)
    }
    
    // Verify certificate matches registered provider
    if cert.Subject.CommonName != p.ID {
        return fmt.Errorf("certificate mismatch: expected %s, got %s", p.ID, cert.Subject.CommonName)
    }
    
    // Verify certificate not revoked
    if p.isRevoked(cert.SerialNumber) {
        return fmt.Errorf("certificate has been revoked")
    }
    
    return nil
}
```

### 9.3 Incident Response

**Provider Slashing Conditions:**
| Violation | Evidence Required | Penalty | Appeal Window |
|-----------|-------------------|---------|---------------|
| Invalid output | Consumer report + re-execution | 5% of stake | 7 days |
| Downtime | 99% uptime SLA breach | 1% per violation | 3 days |
| Late delivery | Timeout breach | 0.5% per violation | 3 days |
| Model extraction | Pattern analysis | 10% of stake | 14 days |
| Sybil activity | IP/hardware correlation | 100% of stake | 7 days |

---

## 10. Performance Targets

### 10.1 Service Level Objectives (SLOs)

| Metric | Target | Measurement Period | Alert Threshold |
|--------|--------|-------------------|-----------------|
| API Response Time (p50) | < 100ms | 1 minute | > 200ms |
| API Response Time (p95) | < 300ms | 1 minute | > 500ms |
| API Response Time (p99) | < 500ms | 1 minute | > 1000ms |
| Job Matching Latency | < 5s | Per job | > 10s |
| Inference Latency (p95) | < 2s | 1 hour | > 5s |
| Provider Discovery Time | < 30s | Per registration | > 60s |
| Escrow Settlement | < 6s | Per settlement | > 12s |
| Provider Uptime | > 99.9% | 30 days | < 99% |
| API Availability | > 99.99% | 30 days | < 99.9% |
| Blockchain Availability | > 99.99% | 30 days | < 99.9% |

### 10.2 Capacity Planning

**Horizontal Scaling Targets:**
```
Phase 1 (Launch):
- Providers: 100
- Concurrent jobs: 1,000
- API requests/sec: 1,000
- Daily jobs: 50,000

Phase 2 (Growth):
- Providers: 1,000
- Concurrent jobs: 10,000
- API requests/sec: 10,000
- Daily jobs: 500,000

Phase 3 (Scale):
- Providers: 10,000
- Concurrent jobs: 100,000
- API requests/sec: 100,000
- Daily jobs: 5,000,000
```

**Resource Requirements:**
| Component | Phase 1 | Phase 2 | Phase 3 |
|-----------|---------|---------|---------|
| API Gateway | 2 nodes (4 vCPU, 8GB) | 4 nodes | 20 nodes (autoscaling) |
| Database | 1 primary + 1 replica | 2 shards | 10 shards |
| Redis | 1 node (4GB) | 3 nodes cluster | 6 nodes cluster |
| Blockchain Validators | 21 | 50 | 100 |
| Full Nodes | 5 | 20 | 100 |

---

## 11. Deployment Architecture

### 11.1 Production Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Production Environment                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐ │
│   │                              Cloudflare CDN                               │ │
│   │                    (DDoS protection, SSL, caching)                          │ │
│   └──────────────────────────────────┬───────────────────────────────────────┘ │
│                                      │                                          │
│   ┌──────────────────────────────────┴───────────────────────────────────────┐    │
│   │                         Kubernetes Cluster (EKS/GKE)                      │    │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │    │
│   │  │  API Gateway    │  │  API Gateway    │  │  API Gateway    │          │    │
│   │  │  Pod 1          │  │  Pod 2          │  │  Pod N          │          │    │
│   │  │  (3 replicas)   │  │                 │  │                 │          │    │
│   │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │    │
│   │           │                    │                    │                   │    │
│   │           └────────────────────┼────────────────────┘                   │    │
│   │                                  │                                       │    │
│   │                           ┌──────┴──────┐                               │    │
│   │                           │  ALB/NGINX  │                               │    │
│   │                           │  Ingress    │                               │    │
│   │                           └──────┬──────┘                               │    │
│   │                                  │                                       │    │
│   │  ┌─────────────────┐  ┌──────────┴──────────┐  ┌─────────────────┐      │    │
│   │  │  Redis Cluster  │  │  PostgreSQL (RDS)   │  │  Monitoring     │      │    │
│   │  │  (6 nodes)      │  │  (Multi-AZ)         │  │  (Prometheus)   │      │    │
│   │  └─────────────────┘  └─────────────────────┘  └─────────────────┘      │    │
│   └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────────┐ │
│   │                         Blockchain Network (Validator Set)                  │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │ │
│   │  │  Validator 1    │  │  Validator 2    │  │  Validator N    │              │ │
│   │  │  (Sentry nodes) │  │                 │  │                 │              │ │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────┘              │ │
│   │                                                                              │ │
│   │  ┌────────────────────────────────────────────────────────────────────────┐│ │
│   │  │                         Full Nodes / Seed Nodes                         ││ │
│   │  └────────────────────────────────────────────────────────────────────────┘│ │
│   └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Infrastructure as Code

**Terraform Configuration Structure:**
```
infrastructure/
├── terraform/
│   ├── modules/
│   │   ├── eks/              # Kubernetes cluster
│   │   ├── rds/              # PostgreSQL database
│   │   ├── elasticache/      # Redis cluster
│   │   ├── vpc/              # Networking
│   │   └── alb/              # Load balancers
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── global/
│       ├── iam/
│       └── route53/
└── kubernetes/
    ├── base/
    │   ├── api-gateway/
    │   ├── redis/
    │   └── monitoring/
    └── overlays/
        ├── dev/
        ├── staging/
        └── prod/
```

---

## 12. Integration Patterns

### 12.1 SDK Implementation

**Python SDK (OpenAI-Compatible):**
```python
from openai import OpenAI

# Simply change the base URL and API key
client = OpenAI(
    base_url="https://api.localbase.network/v1",
    api_key="lb_sk_xxxxxxxxxxxxxxxxxxxx"
)

# All standard OpenAI methods work
completion = client.chat.completions.create(
    model="lb-llama-3-70b",
    messages=[{"role": "user", "content": "Hello!"}]
)

# LocalBase-specific extensions
completion = client.chat.completions.create(
    model="lb-llama-3-70b",
    messages=[{"role": "user", "content": "Hello!"}],
    extra_body={
        "provider_preferences": {
            "min_reputation": 0.9,
            "max_price_per_token": 0.0000001
        }
    }
)
```

**JavaScript SDK:**
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.localbase.network/v1',
  apiKey: 'lb_sk_xxxxxxxxxxxxxxxxxxxx'
});

// Streaming
const stream = await client.chat.completions.create({
  model: 'lb-llama-3-70b',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### 12.2 Webhook Integration

**Webhook Events:**
```typescript
interface WebhookPayload {
  id: string;              // Event ID
  type: WebhookEventType;  // Event type
  created: number;         // Unix timestamp
  data: {
    job?: Job;
    provider?: Provider;
    escrow?: Escrow;
    // ...
  };
}

type WebhookEventType =
  | 'job.created'
  | 'job.assigned'
  | 'job.started'
  | 'job.completed'
  | 'job.failed'
  | 'escrow.released'
  | 'provider.registered'
  | 'provider.updated';

// Webhook signature verification
function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## 13. Testing Strategy

### 13.1 Test Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  10% - Critical user flows
                    │  (Cypress)      │
                   ┌─────────────────┐
                   │ Integration     │  30% - Component interaction
                   │   Tests         │
                  ┌─────────────────┐
                  │   Unit Tests    │  60% - Individual functions
                  │  (Jest/Vitest)  │
                  └─────────────────┘
```

### 13.2 Test Categories

**Unit Tests (Jest):**
```typescript
describe('ProviderSelectionEngine', () => {
  describe('calculateProviderScore', () => {
    it('should score highly for providers with good reputation', () => {
      const provider = createMockProvider({ reputation: 0.98 });
      const job = createMockJob({ minReputation: 0.9 });
      
      const score = engine.calculateProviderScore(provider, job);
      
      expect(score).toBeGreaterThan(0.9);
    });
    
    it('should penalize providers exceeding max price', () => {
      const provider = createMockProvider({ pricePerToken: 0.000001 });
      const job = createMockJob({ maxPricePerToken: 0.0000005 });
      
      const score = engine.calculateProviderScore(provider, job);
      
      expect(score).toBeLessThan(0.5);
    });
  });
});
```

**Integration Tests (Supertest):**
```typescript
describe('Job API', () => {
  it('should create job and route to provider', async () => {
    // Setup: Register provider
    const provider = await registerProvider({
      models: ['lb-test-model'],
      endpoint: 'http://test-provider:8080'
    });
    
    // Execute: Create job
    const response = await request(app)
      .post('/v1/chat/completions')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({
        model: 'lb-test-model',
        messages: [{ role: 'user', content: 'Test' }]
      });
    
    // Verify
    expect(response.status).toBe(200);
    expect(response.body.provider_id).toBe(provider.id);
    expect(response.body.choices[0].message.content).toBeDefined();
  });
});
```

**E2E Tests (Cypress):**
```typescript
describe('Provider Onboarding', () => {
  it('should complete full provider registration flow', () => {
    cy.visit('/provider/register');
    
    // Fill registration form
    cy.get('[data-testid="provider-name"]').type('Test Provider');
    cy.get('[data-testid="gpu-type"]').select('NVIDIA RTX 4090');
    cy.get('[data-testid="endpoint-url"]').type('https://provider.example.com');
    
    // Submit
    cy.get('[data-testid="register-button"]').click();
    
    // Verify success
    cy.url().should('include', '/provider/dashboard');
    cy.get('[data-testid="provider-status"]').should('contain', 'Active');
  });
});
```

**Load Tests (k6):**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Ramp up
    { duration: '5m', target: 200 },   // Steady state
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const payload = JSON.stringify({
    model: 'lb-llama-3-70b',
    messages: [{ role: 'user', content: 'Hello' }],
  });
  
  const res = http.post('https://api.localbase.network/v1/chat/completions', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 14. Operational Runbooks

### 14.1 Deployment Procedures

**Blockchain Upgrade (Coordinated):**
```bash
#!/bin/bash
# upgrade-blockchain.sh

VERSION="v1.2.0"
UPGRADE_HEIGHT=$(curl -s http://localhost:26657/status | jq '.result.sync_info.latest_block_height | tonumber + 100')

# 1. Submit upgrade proposal
localbasechaind tx gov submit-proposal software-upgrade $VERSION \
  --title "Upgrade to $VERSION" \
  --description "Performance improvements and new features" \
  --upgrade-height $UPGRADE_HEIGHT \
  --upgrade-info '{"binaries":{"linux/amd64":"https://..."}}' \
  --deposit 10000000ulb \
  --from validator \
  --chain-id localbase-1

# 2. Vote on proposal
localbasechaind tx gov vote 1 yes --from validator --chain-id localbase-1

# 3. Wait for upgrade height
# 4. Install new binary
# 5. Restart with --halt-height 0
```

**API Gateway Deployment:**
```bash
#!/bin/bash
# deploy-api-gateway.sh

ENVIRONMENT=${1:-staging}
VERSION=$(git describe --tags --always)

# 1. Build container
docker build -t localbase/api-gateway:$VERSION .
docker push localbase/api-gateway:$VERSION

# 2. Update Kubernetes
kubectl set image deployment/api-gateway \
  api-gateway=localbase/api-gateway:$VERSION \
  -n $ENVIRONMENT

# 3. Wait for rollout
kubectl rollout status deployment/api-gateway -n $ENVIRONMENT

# 4. Run smoke tests
./scripts/smoke-tests.sh $ENVIRONMENT

# 5. Notify on success/failure
```

### 14.2 Incident Response

**Provider Outage Response:**
```
1. DETECT
   - Alert from monitoring: Provider p99 latency > 10s
   - Check: Provider status page, logs

2. TRIAGE
   - If single provider: Route traffic to backup providers
   - If multiple providers: Check network connectivity, blockchain status

3. MITIGATE
   - Disable problematic provider: `kubectl exec -it blockchain-node -- localbasechaind tx provider update-status <id> inactive`
   - Notify consumers of potential delays
   - Initiate provider investigation

4. RESOLVE
   - Provider fixes issue or is removed
   - Re-enable when healthy
   - Post-incident review

5. LEARN
   - Document root cause
   - Update runbooks
   - Implement preventive measures
```

---

## 15. Dependencies and Tooling

### 15.1 Core Dependencies

| Category | Dependency | Version | Purpose |
|----------|------------|---------|---------|
| **Frontend** | next | 14.x | React framework |
| | react | 18.x | UI library |
| | tailwindcss | 3.x | Styling |
| | @cosmjs/* | 0.32.x | Cosmos SDK client |
| | @keplr-wallet | latest | Wallet integration |
| **API** | fastify | 4.x | HTTP framework |
| | @supabase/supabase-js | 2.x | Database client |
| | ioredis | 5.x | Redis client |
| | zod | 3.x | Schema validation |
| **Blockchain** | cosmos-sdk | 0.47.x | Blockchain framework |
| | tendermint | 0.34.x | Consensus engine |
| | wasmd | 0.41.x | CosmWasm integration |
| | ibc-go | 7.x | Inter-blockchain communication |
| **Provider** | vllm | 0.3.x | Inference engine |
| | dockerode | 4.x | Docker API client |
| | @grpc/grpc-js | 1.x | gRPC client |

### 15.2 Development Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **TypeScript** | Type safety | tsconfig.json with strict mode |
| **ESLint** | Linting | @typescript-eslint/recommended |
| **Prettier** | Formatting | 2-space indent, 100 char line |
| **Husky** | Git hooks | Pre-commit lint and type-check |
| **Jest** | Unit testing | Coverage threshold 80% |
| **Cypress** | E2E testing | Headless in CI |
| **k6** | Load testing | 1000 RPS target |
| **Docker** | Containerization | Multi-stage builds |
| **Terraform** | Infrastructure | Remote state in S3 |

---

## 16. References

### 16.1 Internal Documentation

| Document | Path | Purpose |
|----------|------|---------|
| SOTA Research | `SOTA.md` | State-of-the-art analysis |
| Architecture Decisions | `ADRs.md` | Design decisions |
| API Specification | `localbase/docs/api_specification.md` | Detailed API docs |
| Blockchain Spec | `localbase/docs/blockchain_specification.md` | Chain details |
| Provider Spec | `localbase/docs/provider_node_specification.md` | Provider software |

### 16.2 External References

1. [Cosmos SDK Documentation](https://docs.cosmos.network/) - Blockchain framework
2. [Tendermint Consensus](https://docs.tendermint.com/) - Consensus engine
3. [OpenAI API Reference](https://platform.openai.com/docs/api-reference) - API compatibility target
4. [CosmJS Documentation](https://cosmos.github.io/cosmjs/) - JavaScript SDK client
5. [IBC Protocol](https://ibc.cosmos.network/) - Cross-chain communication
6. [vLLM Documentation](https://docs.vllm.ai/) - Inference engine

### 16.3 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial specification |
| 2.0.0 | 2024-08-20 | OpenAI API compatibility added |
| 3.0.0 | 2026-04-04 | Full nanovms-level documentation |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Consumer** | User who submits AI inference jobs |
| **Provider** | GPU owner who executes inference jobs |
| **Escrow** | Locked funds pending job completion |
| **Reputation** | Quality score based on historical performance |
| **DePIN** | Decentralized Physical Infrastructure Network |
| **IBC** | Inter-Blockchain Communication protocol |
| **CosmWasm** | WebAssembly smart contract platform for Cosmos |
| **Tendermint** | Byzantine Fault Tolerant consensus engine |
| **vLLM** | High-throughput inference engine for LLMs |

## Appendix B: Quick Reference

**CLI Commands:**
```bash
# Provider registration
localbasechaind tx provider register --hardware-info '{"gpu_type":"RTX4090"}' --from mykey

# Submit job
localbasechaind tx job create --model lb-llama-3-70b --input "Hello" --from mykey

# Query providers
localbasechaind query provider list

# Query job status
localbasechaind query job get <job-id>
```

**Environment Variables:**
```bash
# API Gateway
API_PORT=8000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
BLOCKCHAIN_RPC=https://...
JWT_SECRET=...

# Provider Node
PROVIDER_WALLET_PATH=/etc/localbase/wallet.json
BLOCKCHAIN_GRPC=https://...
MODEL_PATH=/var/models
GPU_DEVICE=0
```

## Appendix C: Detailed Module Specifications

### C.1 Provider Module - Deep Dive

**State Storage:**
```
Store Key Prefixes:
├── 0x01 | ProviderKey | providerID → Provider
├── 0x02 | ProviderByOwnerKey | owner | providerID → nil
├── 0x03 | ProviderByModelKey | model | providerID → nil
├── 0x04 | ProviderByRegionKey | region | providerID → nil
├── 0x05 | ProviderByStatusKey | status | providerID → nil
└── 0x06 | BenchmarkResultsKey | providerID → BenchmarkResults
```

**Message Handlers:**
```go
// MsgRegisterProvider
func (k msgServer) RegisterProvider(goCtx context.Context, msg *types.MsgRegisterProvider) (*types.MsgRegisterProviderResponse, error) {
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    // Validate basic
    if err := msg.ValidateBasic(); err != nil {
        return nil, err
    }
    
    // Check if provider already registered
    existingProvider, found := k.GetProviderByOwner(ctx, msg.Creator)
    if found {
        return nil, sdkerrors.Wrapf(types.ErrProviderAlreadyExists, "owner %s already has provider %s", msg.Creator, existingProvider.ID)
    }
    
    // Verify stake requirement
    minimumStake := k.GetParams(ctx).MinimumProviderStake
    account := k.authKeeper.GetAccount(ctx, msg.Creator)
    balance := k.bankKeeper.GetBalance(ctx, account.GetAddress(), "lb")
    if balance.Amount.LT(minimumStake.Amount) {
        return nil, sdkerrors.Wrapf(types.ErrInsufficientStake, "minimum stake required: %s, got: %s", minimumStake, balance)
    }
    
    // Create provider
    provider := types.NewProvider(
        k.GenerateProviderID(ctx),
        msg.Creator,
        msg.Name,
        msg.HardwareInfo,
        msg.ModelsSupported,
        msg.Pricing,
        msg.Region,
        msg.EndpointURL,
    )
    
    // Send stake to module account
    if err := k.bankKeeper.SendCoinsFromAccountToModule(ctx, msg.Creator, types.ModuleName, sdk.NewCoins(minimumStake)); err != nil {
        return nil, err
    }
    
    // Store provider
    k.SetProvider(ctx, provider)
    k.SetProviderByOwner(ctx, msg.Creator, provider.ID)
    
    // Update indexes
    for _, model := range msg.ModelsSupported {
        k.SetProviderByModel(ctx, model, provider.ID)
    }
    k.SetProviderByRegion(ctx, msg.Region, provider.ID)
    k.SetProviderByStatus(ctx, types.ProviderStatusPending, provider.ID)
    
    // Emit event
    ctx.EventManager().EmitEvent(
        sdk.NewEvent(
            types.EventTypeProviderRegistered,
            sdk.NewAttribute(types.AttributeKeyProviderID, provider.ID),
            sdk.NewAttribute(types.AttributeKeyOwner, msg.Creator.String()),
            sdk.NewAttribute(types.AttributeKeyStake, minimumStake.String()),
        ),
    )
    
    return &types.MsgRegisterProviderResponse{ProviderId: provider.ID}, nil
}

// MsgUpdateProviderStatus
func (k msgServer) UpdateProviderStatus(goCtx context.Context, msg *types.MsgUpdateProviderStatus) (*types.MsgUpdateProviderStatusResponse, error) {
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    provider, found := k.GetProvider(ctx, msg.ProviderId)
    if !found {
        return nil, sdkerrors.Wrapf(types.ErrProviderNotFound, "provider %s not found", msg.ProviderId)
    }
    
    // Only owner or authority can update
    if msg.Creator != provider.Owner.String() && !k.HasAuthority(ctx, msg.Creator) {
        return nil, sdkerrors.Wrap(sdkerrors.ErrUnauthorized, "only owner or authority can update status")
    }
    
    oldStatus := provider.Status
    provider.Status = msg.Status
    provider.UpdatedAt = ctx.BlockTime().Unix()
    
    k.SetProvider(ctx, provider)
    
    // Update status index
    k.RemoveProviderByStatus(ctx, oldStatus, provider.ID)
    k.SetProviderByStatus(ctx, msg.Status, provider.ID)
    
    ctx.EventManager().EmitEvent(
        sdk.NewEvent(
            types.EventTypeProviderStatusChanged,
            sdk.NewAttribute(types.AttributeKeyProviderID, provider.ID),
            sdk.NewAttribute(types.AttributeKeyOldStatus, string(oldStatus)),
            sdk.NewAttribute(types.AttributeKeyNewStatus, string(msg.Status)),
        ),
    )
    
    return &types.MsgUpdateProviderStatusResponse{}, nil
}
```

**Query Handlers:**
```go
// QueryProvider
func (k Keeper) Provider(c context.Context, req *types.QueryProviderRequest) (*types.QueryProviderResponse, error) {
    if req == nil || req.Id == "" {
        return nil, status.Error(codes.InvalidArgument, "invalid request")
    }
    
    ctx := sdk.UnwrapSDKContext(c)
    provider, found := k.GetProvider(ctx, req.Id)
    if !found {
        return nil, status.Errorf(codes.NotFound, "provider %s not found", req.Id)
    }
    
    return &types.QueryProviderResponse{Provider: &provider}, nil
}

// QueryProviders
func (k Keeper) Providers(c context.Context, req *types.QueryProvidersRequest) (*types.QueryProvidersResponse, error) {
    ctx := sdk.UnwrapSDKContext(c)
    
    var providers []types.Provider
    store := ctx.KVStore(k.storeKey)
    
    // Use pagination
    pageRes, err := query.Paginate(store, types.ProviderKeyPrefix(), req.Pagination, func(key, value []byte) error {
        var provider types.Provider
        if err := k.cdc.Unmarshal(value, &provider); err != nil {
            return err
        }
        
        // Apply filters
        if req.Status != "" && provider.Status != types.ProviderStatus(req.Status) {
            return nil
        }
        if req.Region != "" && provider.Region != req.Region {
            return nil
        }
        if req.MinReputation != nil && provider.Reputation.LT(*req.MinReputation) {
            return nil
        }
        
        providers = append(providers, provider)
        return nil
    })
    
    if err != nil {
        return nil, status.Error(codes.Internal, err.Error())
    }
    
    return &types.QueryProvidersResponse{
        Providers:  providers,
        Pagination: pageRes,
    }, nil
}

// QueryProvidersByModel
func (k Keeper) ProvidersByModel(c context.Context, req *types.QueryProvidersByModelRequest) (*types.QueryProvidersResponse, error) {
    ctx := sdk.UnwrapSDKContext(c)
    
    var providers []types.Provider
    store := ctx.KVStore(k.storeKey)
    prefix := types.ProviderByModelKey(req.Model)
    
    iterator := sdk.KVStorePrefixIterator(store, prefix)
    defer iterator.Close()
    
    for ; iterator.Valid(); iterator.Next() {
        // Extract provider ID from key
        providerID := string(iterator.Value())
        provider, found := k.GetProvider(ctx, providerID)
        if !found {
            continue
        }
        
        // Skip inactive providers
        if provider.Status != types.ProviderStatusActive {
            continue
        }
        
        providers = append(providers, provider)
    }
    
    return &types.QueryProvidersResponse{Providers: providers}, nil
}
```

### C.2 Job Module - Deep Dive

**Job State Machine:**
```
┌─────────┐    CreateJob     ┌──────────┐
│  nil    │ ───────────────▶ │  Pending │
└─────────┘                  └────┬─────┘
                                  │
                     AssignJob    │
                                  ▼
┌─────────┐   CompleteJob    ┌──────────┐
│Completed│ ◀─────────────── │ Assigned │
└─────────┘                  └────┬─────┘
      ▲                           │
      │           StartJob        │
      │      ◀────────────────────┘
      │                            │
      │      FailJob      ┌──────────┐
      └────────────────── │  Running │
                          └──────────┘
                               │
                               │ CancelJob
                               ▼
                          ┌──────────┐
                          │ Cancelled│
                          └──────────┘
```

**Job Scheduling Algorithm:**
```go
// Optimistic scheduling with fallback
type Scheduler struct {
    matchingEngine  *MatchingEngine
    queueManager    *QueueManager
    metrics         *SchedulerMetrics
}

func (s *Scheduler) ScheduleJob(ctx context.Context, job types.Job) (*types.Provider, error) {
    start := time.Now()
    defer func() {
        s.metrics.SchedulingDuration.Observe(time.Since(start).Seconds())
    }()
    
    // Phase 1: Fast path - try immediate matching
    provider, err := s.fastMatch(ctx, job)
    if err == nil {
        s.metrics.FastMatchSuccess.Inc()
        return provider, nil
    }
    
    // Phase 2: Queue for later matching
    if err := s.queueManager.Enqueue(ctx, job); err != nil {
        return nil, fmt.Errorf("failed to queue job: %w", err)
    }
    
    // Phase 3: Wait for match with timeout
    provider, err = s.waitForMatch(ctx, job.ID, 5*time.Second)
    if err != nil {
        s.metrics.ScheduleTimeout.Inc()
        return nil, fmt.Errorf("job scheduling timeout: %w", err)
    }
    
    return provider, nil
}

func (s *Scheduler) fastMatch(ctx context.Context, job types.Job) (*types.Provider, error) {
    // Get eligible providers
    providers, err := s.matchingEngine.GetEligibleProviders(ctx, job)
    if err != nil {
        return nil, err
    }
    
    if len(providers) == 0 {
        return nil, types.ErrNoEligibleProviders
    }
    
    // Score and rank
    scored := make([]ScoredProvider, len(providers))
    for i, p := range providers {
        score := s.matchingEngine.CalculateScore(p, job)
        scored[i] = ScoredProvider{Provider: p, Score: score}
    }
    
    sort.Slice(scored, func(i, j int) bool {
        return scored[i].Score > scored[j].Score
    })
    
    // Try to assign to top provider
    for _, sp := range scored {
        if err := s.tryAssign(ctx, job, sp.Provider); err == nil {
            return &sp.Provider, nil
        }
    }
    
    return nil, types.ErrAssignmentFailed
}

func (s *Scheduler) tryAssign(ctx context.Context, job types.Job, provider types.Provider) error {
    // Optimistic assignment with CAS-like semantics
    currentJobCount := s.getProviderJobCount(provider.ID)
    if currentJobCount >= int(provider.MaxConcurrentJobs) {
        return types.ErrProviderAtCapacity
    }
    
    // Atomically increment and assign
    if !s.incrementProviderJobCount(provider.ID, currentJobCount) {
        return types.ErrConcurrentAssignment // Retry
    }
    
    // Send assignment to provider
    if err := s.notifyProvider(ctx, provider, job); err != nil {
        s.decrementProviderJobCount(provider.ID)
        return err
    }
    
    return nil
}
```

### C.3 Payment Module - Deep Dive

**Escrow Lifecycle:**
```go
type EscrowMachine struct {
    keeper types.PaymentKeeper
}

func (m *EscrowMachine) Create(ctx sdk.Context, jobID string, consumer, provider sdk.AccAddress, amount sdk.Coins) (*types.Escrow, error) {
    escrow := types.NewEscrow(
        m.generateEscrowID(ctx),
        jobID,
        consumer,
        provider,
        amount,
        ctx.BlockTime().Add(m.getEscrowTimeout(ctx)),
    )
    
    // Transfer funds from consumer to escrow module account
    if err := m.keeper.BankKeeper().SendCoinsFromAccountToModule(
        ctx, consumer, types.ModuleName, amount,
    ); err != nil {
        return nil, fmt.Errorf("failed to fund escrow: %w", err)
    }
    
    m.keeper.SetEscrow(ctx, escrow)
    
    ctx.EventManager().EmitEvent(
        sdk.NewEvent(
            types.EventTypeEscrowCreated,
            sdk.NewAttribute(types.AttributeKeyEscrowID, escrow.ID),
            sdk.NewAttribute(types.AttributeKeyJobID, jobID),
            sdk.NewAttribute(types.AttributeKeyAmount, amount.String()),
        ),
    )
    
    return &escrow, nil
}

func (m *EscrowMachine) Release(ctx sdk.Context, escrowID string) error {
    escrow, found := m.keeper.GetEscrow(ctx, escrowID)
    if !found {
        return types.ErrEscrowNotFound
    }
    
    if escrow.Status != types.EscrowStatusPending {
        return types.ErrEscrowNotReleasable
    }
    
    // Transfer from escrow to provider
    if err := m.keeper.BankKeeper().SendCoinsFromModuleToAccount(
        ctx, types.ModuleName, escrow.Provider, escrow.Amount,
    ); err != nil {
        return fmt.Errorf("failed to release escrow: %w", err)
    }
    
    escrow.Status = types.EscrowStatusReleased
    escrow.ReleasedAt = ctx.BlockTime()
    m.keeper.SetEscrow(ctx, escrow)
    
    ctx.EventManager().EmitEvent(
        sdk.NewEvent(
            types.EventTypeEscrowReleased,
            sdk.NewAttribute(types.AttributeKeyEscrowID, escrowID),
            sdk.NewAttribute(types.AttributeKeyAmount, escrow.Amount.String()),
        ),
    )
    
    return nil
}

func (m *EscrowMachine) Refund(ctx sdk.Context, escrowID string, reason string) error {
    escrow, found := m.keeper.GetEscrow(ctx, escrowID)
    if !found {
        return types.ErrEscrowNotFound
    }
    
    if escrow.Status != types.EscrowStatusPending {
        return types.ErrEscrowNotRefundable
    }
    
    // Transfer from escrow back to consumer
    if err := m.keeper.BankKeeper().SendCoinsFromModuleToAccount(
        ctx, types.ModuleName, escrow.Consumer, escrow.Amount,
    ); err != nil {
        return fmt.Errorf("failed to refund escrow: %w", err)
    }
    
    escrow.Status = types.EscrowStatusRefunded
    escrow.RefundedAt = ctx.BlockTime()
    m.keeper.SetEscrow(ctx, escrow)
    
    ctx.EventManager().EmitEvent(
        sdk.NewEvent(
            types.EventTypeEscrowRefunded,
            sdk.NewAttribute(types.AttributeKeyEscrowID, escrowID),
            sdk.NewAttribute(types.AttributeKeyReason, reason),
        ),
    )
    
    return nil
}
```

## Appendix D: Genesis Configuration

**genesis.json Structure:**
```json
{
  "genesis_time": "2026-04-01T00:00:00.000000000Z",
  "chain_id": "localbase-1",
  "initial_height": "1",
  "consensus_params": {
    "block": {
      "max_bytes": "2000000",
      "max_gas": "20000000"
    },
    "evidence": {
      "max_age_num_blocks": "100000",
      "max_age_duration": "172800000000000",
      "max_bytes": "1000000"
    },
    "validator": {
      "pub_key_types": ["ed25519"]
    },
    "version": {
      "app": "0"
    }
  },
  "app_state": {
    "auth": {
      "params": {
        "max_memo_characters": "256",
        "tx_sig_limit": "7",
        "tx_size_cost_per_byte": "10",
        "sig_verify_cost_ed25519": "590",
        "sig_verify_cost_secp256k1": "1000"
      },
      "accounts": [
        {
          "@type": "/cosmos.auth.v1beta1.BaseAccount",
          "address": "localbase1...",
          "pub_key": null,
          "account_number": "0",
          "sequence": "0"
        }
      ]
    },
    "bank": {
      "params": {
        "send_enabled": [{"denom": "ulb", "enabled": true}],
        "default_send_enabled": true
      },
      "balances": [
        {
          "address": "localbase1...",
          "coins": [{"denom": "ulb", "amount": "1000000000000"}]
        }
      ],
      "supply": [{"denom": "ulb", "amount": "1000000000000"}],
      "denom_metadata": [
        {
          "description": "The native token of LocalBase",
          "denom_units": [
            {"denom": "ulb", "exponent": 0, "aliases": ["microlb"]},
            {"denom": "lb", "exponent": 6, "aliases": []}
          ],
          "base": "ulb",
          "display": "lb",
          "name": "LocalBase Token",
          "symbol": "LB"
        }
      ]
    },
    "staking": {
      "params": {
        "unbonding_time": "1814400s",
        "max_validators": 100,
        "max_entries": 7,
        "historical_entries": 10000,
        "bond_denom": "ulb"
      },
      "validators": [],
      "exported": false
    },
    "mint": {
      "minter": {
        "inflation": "0.080000000000000000",
        "annual_provisions": "0.000000000000000000"
      },
      "params": {
        "mint_denom": "ulb",
        "inflation_rate_change": "0.130000000000000000",
        "inflation_max": "0.080000000000000000",
        "inflation_min": "0.020000000000000000",
        "goal_bonded": "0.670000000000000000",
        "blocks_per_year": "5256000"
      }
    },
    "provider": {
      "params": {
        "minimum_stake": {"denom": "ulb", "amount": "100000000000"},
        "registration_fee": {"denom": "ulb", "amount": "10000000"},
        "slash_fraction_downtime": "0.010000000000000000",
        "downtime_duration": "86400s",
        "max_providers": 10000
      },
      "providers": []
    },
    "job": {
      "params": {
        "max_job_input_size": 1048576,
        "max_job_output_size": 10485760,
        "job_timeout": "300s",
        "min_job_price": {"denom": "ulb", "amount": "1000"},
        "max_concurrent_jobs_per_provider": 100
      },
      "jobs": []
    },
    "payment": {
      "params": {
        "escrow_timeout": "86400s",
        "dispute_window": "604800s",
        "burn_rate": "0.010000000000000000"
      },
      "escrows": []
    },
    "reputation": {
      "params": {
        "reputation_decay_rate": "0.001000000000000000",
        "reputation_decay_interval": "86400s",
        "minimum_jobs_for_reputation": 10,
        "default_reputation": "0.500000000000000000"
      },
      "reputations": []
    }
  }
}
```

## Appendix E: Migration Guide

**Migrating from OpenAI:**
```python
# Before (OpenAI)
import openai

openai.api_key = "sk-..."

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)

# After (LocalBase)
import openai

openai.api_base = "https://api.localbase.network/v1"
openai.api_key = "lb_sk_..."

response = openai.ChatCompletion.create(
    model="lb-llama-3-70b",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**SDK Client Migration:**
```javascript
// Before
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// After
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.LOCALBASE_API_KEY,
  basePath: 'https://api.localbase.network/v1'
});
const openai = new OpenAIApi(configuration);
```

---

*Specification Version: 3.0.0*
*Last Updated: 2026-04-04*
*Total Lines: ~2600*
