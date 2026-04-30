# Architecture Decision Records (ADRs)

## ADR-001: Blockchain Platform Selection

### Status
- **Status**: Accepted
- **Date**: 2026-04-04
- **Deciders**: LocalBase Core Team

### Context

LocalBase3 requires a blockchain platform for coordinating the decentralized AI compute marketplace. The choice of platform impacts:
- Transaction throughput and latency
- Interoperability with other chains
- Developer experience and tooling
- Consensus mechanism and security
- Upgrade path and governance

**Requirements:**
1. Support for custom application logic (job matching, reputation, escrow)
2. High throughput for job transactions (target: 1000+ TPS)
3. Fast finality for real-time job matching (target: <6 seconds)
4. Interoperability for cross-chain payments and provider networks
5. Active ecosystem and tooling
6. Sustainable tokenomics model
7. Path to sovereignty (own validator set)

**Options Considered:**
1. Ethereum L1 (Solidity)
2. Ethereum L2 (Arbitrum, Optimism, Base)
3. Solana (Rust)
4. Cosmos SDK (Go)
5. Substrate (Rust)
6. Avalanche Subnets (Go)

### Decision

**Selected: Cosmos SDK**

Cosmos SDK provides the optimal balance of customizability, performance, and ecosystem maturity for the LocalBase3 requirements.

### Consequences

**Positive:**
- Full control over application logic through custom modules
- Tendermint consensus provides fast finality (~5s block times)
- IBC enables cross-chain interoperability from day one
- Mature ecosystem (dYdX, Osmosis, Injective as references)
- Go language alignment with existing LocalBase3 team expertise
- Clear upgrade path through governance-based coordinated upgrades
- Sovereign chain with own validator set and token

**Negative:**
- Smaller developer ecosystem than Ethereum
- Cross-chain liquidity fragmentation (mitigated by IBC)
- Need to bootstrap validator set and security
- Additional complexity in chain operations

**Neutral:**
- Go requires compilation (vs JavaScript/Vyper for Ethereum)
- Different mental model than account-based chains (module-based)
- Tendermint BFT vs Ethereum's PoS (different trade-offs)

### Alternatives Analysis

| Platform | Pros | Cons | Score (1-5) |
|----------|------|------|-------------|
| Ethereum L1 | Security, liquidity, tooling | Low TPS, high gas, slow finality | 2 |
| Ethereum L2 | EVM compatibility, lower gas | Shared sequencer risks, exit windows | 3 |
| Solana | High TPS, low latency | Network instability, Rust learning curve | 3 |
| Cosmos SDK | Custom modules, IBC, sovereignty | Smaller ecosystem | 5 |
| Substrate | Flexibility, WASM contracts | Complex upgrade process | 3 |
| Avalanche | Fast finality, subnets | Less mature ecosystem | 3 |

### Implementation Notes

**Module Structure:**
```
x/
├── provider/       # Provider registration and management
├── job/           # Job lifecycle management
├── payment/       # Escrow and settlement
├── reputation/    # Provider scoring
├── governance/    # Protocol parameters
└── tokenomics/    # Inflation and rewards
```

**Key Dependencies:**
- cosmos-sdk v0.47.x
- tendermint v0.34.x
- ibc-go v7.x
- wasmd v0.41.x (for CosmWasm contracts)

**Validator Set:**
- Initial: 21 validators
- Target: 100 validators
- Minimum stake: 100,000 LB
- Commission: 5-20% (validator configurable)

### References

1. [Cosmos SDK Documentation](https://docs.cosmos.network/)
2. [Tendermint Consensus](https://docs.tendermint.com/)
3. [IBC Protocol](https://ibc.cosmos.network/)
4. [Comparing Smart Contract Platforms](https://blog.cosmos.network/)

### Related ADRs

- ADR-003: Job Matching Algorithm
- ADR-004: Cross-Chain Strategy

---

## ADR-002: API Compatibility Strategy

### Status
- **Status**: Accepted
- **Date**: 2026-04-04
- **Deciders**: LocalBase Core Team

### Context

LocalBase3 aims to attract AI developers who currently use centralized providers (OpenAI, Anthropic, etc.). API compatibility reduces friction and enables seamless migration.

**Requirements:**
1. Drop-in replacement for OpenAI API clients
2. Support streaming and non-streaming inference
3. Handle extended parameters (provider selection, reputation filters)
4. Maintain response format compatibility
5. Support major OpenAI SDKs (Python, JavaScript, Go)

**Options Considered:**
1. Proprietary API (completely custom)
2. OpenAI-compatible REST API
3. GraphQL API
4. gRPC with REST gateway
5. Multi-protocol (REST + gRPC)

### Decision

**Selected: OpenAI-compatible REST API**

Implement a REST API that matches OpenAI's endpoints, request/response formats, and authentication patterns, with LocalBase-specific extensions.

### Consequences

**Positive:**
- Immediate compatibility with existing OpenAI SDKs
- Minimal code changes for developers switching providers
- Familiar interface reduces learning curve
- Large ecosystem of tools and integrations work out of the box
- Clear documentation path (reference OpenAI docs)

**Negative:**
- Must track OpenAI API changes
- Some OpenAI features may not map cleanly to decentralized model
- Rate limiting and usage tracking differ from centralized model
- Extensions require careful design to not break compatibility

**Neutral:**
- REST vs GraphQL trade-offs (simplicity vs flexibility)
- JSON vs Protobuf (human-readable vs efficiency)
- Bearer token auth vs API keys (both widely supported)

### API Extension Strategy

**Core Compatibility (Required):**
```
GET /v1/models
GET /v1/models/{id}
POST /v1/chat/completions
POST /v1/completions
POST /v1/embeddings
```

**LocalBase Extensions (Optional Parameters):**
```json
{
  "model": "lb-llama-3-70b",
  "messages": [...],
  "provider_preferences": {
    "min_reputation": 0.9,
    "max_price_per_token": 0.0000001,
    "preferred_provider_id": "provider_1",
    "max_response_time_ms": 500,
    "region": "us-west"
  }
}
```

**Extended Endpoints (LocalBase-Specific):**
```
GET /v1/providers              # List available providers
GET /v1/providers/{id}         # Get provider details
GET /v1/jobs                   # List user's jobs
GET /v1/jobs/{id}              # Get job details
POST /v1/bids                # Request provider bids
POST /v1/bids/{id}/accept      # Accept a provider bid
```

### Implementation Architecture

**Request Flow:**
```
Client Request
    ↓
OpenAI Compatibility Layer (Fastify)
    - Request transformation
    - Authentication
    - Rate limiting
    ↓
Job Router
    - Provider selection (if not specified)
    - Load balancing
    - Fallback handling
    ↓
Provider Node (via gRPC/HTTP)
    - Job execution
    - Result streaming
    ↓
Response Transform
    - OpenAI-compatible format
    - Usage stats injection
    ↓
Client Response
```

**Streaming Implementation:**
```go
// Server-Sent Events for streaming responses
func HandleStreaming(w http.ResponseWriter, req ChatCompletionRequest) {
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    
    for token := range providerStream {
        chunk := ChatCompletionChunk{
            ID:    jobID,
            Model: req.Model,
            Choices: []ChoiceChunk{{
                Delta: ChatMessage{Content: token},
            }},
        }
        
        data, _ := json.Marshal(chunk)
        fmt.Fprintf(w, "data: %s\n\n", data)
        flusher.Flush()
    }
    
    fmt.Fprintf(w, "data: [DONE]\n\n")
}
```

### Error Compatibility

**OpenAI Error Format:**
```json
{
  "error": {
    "message": "The model 'lb-nonexistent' does not exist",
    "type": "invalid_request_error",
    "param": "model",
    "code": "model_not_found"
  }
}
```

**Error Code Mapping:**
| LocalBase Error | OpenAI Type | OpenAI Code |
|-----------------|-------------|-------------|
| Invalid API Key | authentication_error | invalid_api_key |
| Model Not Found | invalid_request_error | model_not_found |
| No Providers | service_unavailable | provider_unavailable |
| Rate Limited | rate_limit_error | rate_limit_exceeded |
| Provider Timeout | service_unavailable | timeout |

### Testing Strategy

1. **Compatibility Test Suite**: Run OpenAI SDK test suite against LocalBase API
2. **Round-trip Tests**: Send OpenAI request → LocalBase → Compare responses
3. **Edge Case Coverage**: Test all OpenAI parameters and error conditions
4. **SDK Integration Tests**: Test with official OpenAI Python/JS SDKs

### References

1. [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
2. [OpenAI Python SDK](https://github.com/openai/openai-python)
3. [OpenAI Node.js SDK](https://github.com/openai/openai-node)

### Related ADRs

- ADR-001: Blockchain Platform Selection
- ADR-003: Job Matching Algorithm

---

## ADR-003: Job Matching and Provider Selection

### Status
- **Status**: Accepted
- **Date**: 2026-04-04
- **Deciders**: LocalBase Core Team

### Context

The core value proposition of LocalBase3 is efficient matching between AI compute consumers and GPU providers. The matching algorithm must balance:
- Consumer requirements (latency, price, quality)
- Provider preferences (price, job types)
- Network efficiency (load balancing, fairness)

**Requirements:**
1. Low latency matching (<5 seconds target)
2. Support consumer preferences (price, reputation, location)
3. Fair distribution of jobs across providers
4. Resilience to provider failures
5. Economic efficiency (maximize network utilization)
6. Transparency in selection decisions

**Options Considered:**
1. Simple First-Fit (first available matching provider)
2. Score-Based Ranking (weighted multi-factor score)
3. Auction/Bidding (providers bid on jobs)
4. Continuous Double Auction (bidirectional matching)
5. Predictive/ML-Based Matching (learn optimal pairings)
6. Consistent Hashing (deterministic routing)

### Decision

**Selected: Score-Based Matching with Auction Fallback**

Default to score-based matching for speed and predictability. Enable auction mode for cost-sensitive or specialized workloads.

### Consequences

**Positive:**
- Predictable behavior for consumers and providers
- Fast matching (no bidding round-trip)
- Transparent scoring (explainable decisions)
- Optional auction for price discovery
- Easy to implement and reason about

**Negative:**
- May not always find optimal price (vs pure auction)
- Fixed weights may not suit all use cases
- Providers may game the scoring factors
- Less efficient price discovery than auction

**Neutral:**
- Score formula can evolve via governance
- Can add ML-based scoring later
- Auction mode available when needed

### Matching Algorithm Design

**Score Formula:**
```go
func CalculateProviderScore(provider Provider, job Job) float64 {
    // Base components (0-1 each)
    reputationScore := provider.Reputation
    
    // Price score: lower is better (exponential decay)
    priceRatio := job.MaxPrice / provider.Price
    priceScore := math.Min(1.0, priceRatio)
    
    // Speed score: faster is better
    speedScore := 1.0 - (provider.AvgResponseTime / job.MaxLatency)
    speedScore = math.Max(0, speedScore)
    
    // Load score: prefer less loaded providers
    loadScore := 1.0 - provider.CurrentLoad/provider.Capacity
    
    // Proximity score: closer is better
    proximityScore := calculateProximity(provider.Location, job.PreferredRegion)
    
    // Weighted combination (governance configurable)
    totalScore := (
        weights.Reputation * reputationScore +
        weights.Price * priceScore +
        weights.Speed * speedScore +
        weights.Load * loadScore +
        weights.Proximity * proximityScore
    )
    
    return totalScore
}
```

**Selection Process:**
```go
func SelectProvider(job Job, providers []Provider) (Provider, error) {
    // Filter ineligible providers
    eligible := filter(providers, func(p Provider) bool {
        return p.Reputation >= job.MinReputation &&
               p.Price <= job.MaxPrice &&
               p.CurrentLoad < p.Capacity &&
               slices.Contains(p.SupportedModels, job.Model)
    })
    
    if len(eligible) == 0 {
        return Provider{}, ErrNoEligibleProviders
    }
    
    // Calculate scores
    scored := make([]ScoredProvider, len(eligible))
    for i, p := range eligible {
        scored[i] = ScoredProvider{
            Provider: p,
            Score:    CalculateProviderScore(p, job),
        }
    }
    
    // Sort by score descending
    sort.Slice(scored, func(i, j int) bool {
        return scored[i].Score > scored[j].Score
    })
    
    // Select top provider (with small randomization to prevent gaming)
    if len(scored) > 1 && rand.Float64() < 0.1 {
        // 10% chance to select 2nd best (if close in score)
        if scored[0].Score - scored[1].Score < 0.1 {
            return scored[1].Provider, nil
        }
    }
    
    return scored[0].Provider, nil
}
```

### Auction Mode

**When to Enable:**
- Consumer explicitly requests bids
- Batch jobs where latency is less critical
- New model launches (price discovery)

**Bid Collection:**
```go
type Bid struct {
    ProviderID    string
    JobID         string
    Price         sdk.Coins
    EstimatedTime time.Duration
    Timestamp     time.Time
    Signature     []byte
}

func (k Keeper) CollectBids(ctx sdk.Context, job Job, timeout time.Duration) []Bid {
    // Emit event for bid solicitation
    ctx.EventManager().EmitEvent(
        sdk.NewEvent(
            types.EventTypeJobBiddingOpen,
            sdk.NewAttribute(types.AttributeKeyJobID, job.ID),
            sdk.NewAttribute(types.AttributeKeyTimeout, timeout.String()),
        ),
    )
    
    // Providers submit bids via SubmitBid transaction
    // Bids stored with job ID prefix
    
    // Wait for timeout or early close (if enough bids received)
    // Return collected bids
}

func (k Keeper) SelectBestBid(bids []Bid) Bid {
    // Sort by price (lowest first), then by reputation
    sort.Slice(bids, func(i, j int) bool {
        if !bids[i].Price.IsEqual(bids[j].Price) {
            return bids[i].Price.IsAllLTE(bids[j].Price)
        }
        providerI := k.providerKeeper.GetProvider(bids[i].ProviderID)
        providerJ := k.providerKeeper.GetProvider(bids[j].ProviderID)
        return providerI.Reputation.GT(providerJ.Reputation)
    })
    
    return bids[0]
}
```

### Provider Preferences

**Consumer-Side Filtering:**
```go
type JobPreferences struct {
    MinReputation      sdk.Dec
    MaxPricePerToken   sdk.Dec
    MaxLatencyMs       int64
    PreferredRegion    string
    PreferredProviders []string  // Whitelist
    ExcludedProviders  []string  // Blacklist
}
```

**Provider-Side Configuration:**
```go
type ProviderPreferences struct {
    MinJobPrice        sdk.Coins
    AcceptedModels     []string
    RejectedModels     []string
    MaxConcurrentJobs  int
    AcceptBatches      bool
    MinReputation      sdk.Dec  // For reverse reputation (provider rates consumer)
}
```

### Load Balancing

**Round-Robin Within Score Bands:**
```go
func SelectWithLoadBalancing(providers []ScoredProvider, job Job) Provider {
    // Group providers by score band
    bands := groupByScoreBand(providers, 0.1) // 0.1 score band width
    
    // For top band, use round-robin selection
    topBand := bands[0]
    selected := topBand[nextRoundRobinIndex % len(topBand)]
    nextRoundRobinIndex++
    
    return selected
}
```

**Sticky Sessions (for multi-turn conversations):**
```go
func SelectForConversation(job Job, conversationID string, providers []Provider) Provider {
    // Hash conversation ID to consistently select provider
    hash := sha256.Sum256([]byte(conversationID))
    index := binary.BigEndian.Uint64(hash[:8]) % uint64(len(providers))
    
    preferredProvider := providers[index]
    
    // Verify still available
    if preferredProvider.CurrentLoad < preferredProvider.Capacity {
        return preferredProvider
    }
    
    // Fall back to normal selection
    return SelectProvider(job, providers)
}
```

### Implementation Notes

**On-Chain vs Off-Chain:**
- Provider registry: On-chain (permanent record)
- Provider status (online/offline): Off-chain (oracle or heartbeat)
- Job matching: Can be off-chain for speed, on-chain for fairness
- Current approach: Off-chain matching with on-chain settlement

**Scoring Parameter Governance:**
```go
type MatchingParams struct {
    ReputationWeight   sdk.Dec
    PriceWeight        sdk.Dec
    SpeedWeight        sdk.Dec
    LoadWeight         sdk.Dec
    ProximityWeight    sdk.Dec
    RandomizationFactor sdk.Dec
}

// Updated via governance proposal
func (k Keeper) UpdateMatchingParams(ctx sdk.Context, params MatchingParams) {
    // Validate weights sum to 1
    total := params.ReputationWeight.Add(params.PriceWeight).Add(
        params.SpeedWeight).Add(params.LoadWeight).Add(params.ProximityWeight)
    
    if !total.Equal(sdk.NewDec(1)) {
        panic("weights must sum to 1")
    }
    
    k.SetMatchingParams(ctx, params)
}
```

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Matching Latency | < 5 seconds | Time from job submission to provider assignment |
| Match Quality | > 90% satisfaction | Consumer feedback on provider performance |
| Provider Utilization | > 60% average | Average GPU load across network |
| Auction Completion | > 80% in 30s | Percentage of auctions receiving bids |

### References

1. [Resource Allocation in Distributed Systems](https://www.cs.cmu.edu/~alvande/papers/rad-tkde.pdf)
2. [Auction Theory](https://www.cambridge.org/core/books/putting-auction-theory-to-work/)
3. [Load Balancing Algorithms](https://www.geeksforgeeks.org/load-balancing-algorithms/)

### Related ADRs

- ADR-001: Blockchain Platform Selection
- ADR-002: API Compatibility Strategy
- ADR-004: Reputation System Design

---

## ADR Summary

| ADR | Title | Status | Impact |
|-----|-------|--------|--------|
| 001 | Blockchain Platform Selection | Accepted | High - Foundation decision |
| 002 | API Compatibility Strategy | Accepted | High - User experience |
| 003 | Job Matching and Provider Selection | Accepted | High - Core value prop |

---

*ADR Index Version: 1.0.0*
*Last Updated: 2026-04-04*
