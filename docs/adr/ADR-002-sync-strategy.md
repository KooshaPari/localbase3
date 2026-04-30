# ADR-002: Offline Sync Strategy

**Document ID:** PHENOTYPE_LOCALBASE3_ADR_002  
**Status:** Accepted  
**Last Updated:** 2026-04-03  
**Author:** Phenotype Architecture Team  
**Deciders:** LocalBase3 Core Team  
**Technical Story:** Provider Node Offline Operation and Blockchain Synchronization

---

## Table of Contents

1. [Context](#1-context)
2. [Decision](#2-decision)
3. [Consequences](#3-consequences)
4. [Architecture Diagrams](#4-architecture-diagrams)
5. [Code Examples](#5-code-examples)
6. [Cross-References](#6-cross-references)

---

## 1. Context

### 1.1 Problem Statement

LocalBase3 provider nodes operate in environments where network connectivity to the blockchain may be intermittent, unreliable, or completely unavailable for extended periods. The sync strategy must ensure:

- **Continuous operation**: Provider nodes continue executing jobs during network partitions
- **Eventual consistency**: Local state converges with blockchain state when connectivity is restored
- **No data loss**: Job results and metrics are preserved during offline periods
- **Conflict resolution**: Conflicting state changes are resolved deterministically
- **Recovery guarantees**: After extended offline periods, the node can catch up without manual intervention

**Key Scenarios:**
1. **Brief disconnection** (seconds to minutes): Normal operation with buffered writes
2. **Extended outage** (hours): Job execution continues, results buffered locally
3. **Prolonged offline** (days): Node accumulates state drift, requires catch-up sync
4. **Reconnection after fork**: Blockchain may have reorganized, requiring state reconciliation

### 1.2 Requirements

```
┌─────────────────────────────────────────────────────────┐
│              Offline Sync Requirements                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  R1: Offline Job Execution                              │
│     Provider nodes MUST continue executing assigned      │
│     jobs when disconnected from the blockchain network.  │
│                                                         │
│  R2: Result Buffering                                   │
│     Job results MUST be stored locally when the node     │
│     cannot submit them to the blockchain.                │
│                                                         │
│  R3: Automatic Reconnection                             │
│     Upon reconnection, the node MUST automatically       │
│     sync buffered results and catch up on state changes. │
│                                                         │
│  R4: Conflict Resolution                                │
│     When local state conflicts with blockchain state,    │
│     the blockchain is the source of truth.               │
│                                                         │
│  R5: Idempotent Operations                              │
│     All sync operations MUST be idempotent to handle     │
│     partial failures and retries safely.                 │
│                                                         │
│  R6: State Pruning                                      │
│     The node MUST prune old local state to prevent       │
│     unbounded disk growth during extended offline.       │
│                                                         │
│  R7: Progress Tracking                                  │
│     The node MUST track sync progress to resume from     │
│     the last successful sync point.                      │
│                                                         │
│  R8: Health Monitoring                                  │
│     The node MUST monitor sync health and alert on       │
│     prolonged sync failures.                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Polling-based sync** | Periodically query blockchain for state changes | Simple, reliable, no server changes | Latency, unnecessary queries, wasteful |
| **Event-driven sync** | Subscribe to blockchain events via WebSocket | Real-time, efficient, low latency | Connection management, reconnection complexity |
| **Hybrid (poll + events)** | Events for real-time, polling as fallback | Best of both worlds, resilient | More complex, dual maintenance |
| **CRDT-based sync** | Use CRDTs for automatic conflict resolution | No conflicts, decentralized | Complex, not suitable for blockchain state |
| **Blockchain light client** | Run a light client for state verification | Full verification, no trust assumptions | Resource-intensive, complex implementation |

### 1.4 Evaluation Matrix

```
┌─────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Criteria        │ Polling  │ Events   │ Hybrid   │ CRDT     │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Simplicity      │ ★★★★★   │ ★★☆☆☆   │ ★★★☆☆   │ ★☆☆☆☆   │
│ Real-time       │ ★☆☆☆☆   │ ★★★★★   │ ★★★★☆   │ ★★★★☆   │
│ Resilience      │ ★★★★☆   │ ★★☆☆☆   │ ★★★★★   │ ★★★★☆   │
│ Resource Usage  │ ★★★☆☆   │ ★★★★★   │ ★★★★☆   │ ★★☆☆☆   │
│ Blockchain Fit  │ ★★★★☆   │ ★★★★☆   │ ★★★★★   │ ★☆☆☆☆   │
│ Implementation  │ ★★★★★   │ ★★★☆☆   │ ★★★☆☆   │ ★★☆☆☆   │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Total           │ 25/30   │ 22/30    │ 27/30    │ 16/30    │
└─────────────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 2. Decision

### 2.1 Primary Decision

**Selected: Hybrid sync strategy combining event-driven real-time sync with periodic polling as fallback.**

The sync system operates in three modes:
1. **Connected mode**: WebSocket subscription to blockchain events for real-time updates
2. **Degraded mode**: Polling-based sync when WebSocket connection is lost
3. **Offline mode**: Local-only operation with result buffering during complete disconnection

### 2.2 Sync Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Hybrid Sync Architecture                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Sync State Machine                   │    │
│  │                                                   │    │
│  │  ┌──────────┐    Connection    ┌───────────┐     │    │
│  │  │ CONNECTED│◀────────────────▶│ DEGRADED  │     │    │
│  │  │          │    Lost          │ (Polling) │     │    │
│  │  │ (Events) │                  │           │     │    │
│  │  └────┬─────┘                  └─────┬─────┘     │    │
│  │       │ Connection                    │           │    │
│  │       │ Established                   │ Timeout   │    │
│  │       │                               │           │    │
│  │       ▼                               ▼           │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │              OFFLINE                      │     │    │
│  │  │  (Local-only, buffer results)             │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │       ▲                                           │    │
│  │       │ Reconnection                              │    │
│  │       │ + Catch-up Sync                           │    │
│  └───────┼───────────────────────────────────────────┘    │
│          │                                               │
│          ▼                                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Sync Components                      │    │
│  │                                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │    │
│  │  │ Event       │  │ Polling     │  │ Catch-up │ │    │
│  │  │ Subscriber  │  │ Scheduler   │  │ Engine   │ │    │
│  │  │             │  │             │  │          │ │    │
│  │  │ • WebSocket │  │ • Interval  │  │ • Block  │ │    │
│  │  │ • Subscribe │  │ • Adaptive  │  │   Replay │ │    │
│  │  │ • Reconnect │  │ • Backoff   │  │ • State  │ │    │
│  │  └─────────────┘  └─────────────┘  │   Diff   │ │    │
│  │                                     └──────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Data Flow                            │    │
│  │                                                   │    │
│  │  Blockchain ──▶ Sync Layer ──▶ Local Storage      │    │
│  │  (Events)     │                (SQLite)           │    │
│  │               │                                   │    │
│  │  Local Results ──▶ Sync Layer ──▶ Blockchain      │    │
│  │  (Buffered)     │   (Submit)     (Transactions)   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Sync Protocol

```
┌─────────────────────────────────────────────────────────┐
│              Sync Protocol Specification                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Phase 1: Connection Establishment                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  1. Open WebSocket to blockchain RPC endpoint    │    │
│  │  2. Subscribe to relevant event types:           │    │
│  │     • job_assigned                               │    │
│  │     • job_completed                              │    │
│  │     • reputation_updated                         │    │
│  │     • provider_status_changed                    │    │
│  │     • governance_parameter_changed               │    │
│  │  3. Request current block height                 │    │
│  │  4. Compare with local last_synced_height        │    │
│  │  5. If behind, initiate catch-up sync (Phase 3)  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Phase 2: Real-time Event Processing                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  For each received event:                        │    │
│  │  1. Validate event signature                     │    │
│  │  2. Check event block height > last_synced       │    │
│  │  3. Apply event to local state (SQLite)          │    │
│  │  4. Update last_synced_height                    │    │
│  │  5. Acknowledge event to sender                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Phase 3: Catch-up Sync (when behind)                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │  1. Query blockchain for blocks from last_synced │    │
│  │     to current height                            │    │
│  │  2. For each block:                              │    │
│  │     a. Fetch block data                          │    │
│  │     b. Extract relevant transactions             │    │
│  │     c. Apply transactions to local state         │    │
│  │     d. Update last_synced_height                 │    │
│  │  3. Process buffered local results               │    │
│  │     (Phase 4)                                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Phase 4: Buffered Result Submission                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  1. Query local DB for pending results           │    │
│  │  2. For each pending result:                     │    │
│  │     a. Check if job still exists on blockchain   │    │
│  │     b. If yes, submit result transaction         │    │
│  │     c. If no, mark result as orphaned            │    │
│  │     d. On success, remove from pending queue     │    │
│  │  3. Retry failed submissions with backoff        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2.4 Adaptive Polling

When WebSocket connection is unavailable, the system falls back to polling with adaptive intervals:

```
┌─────────────────────────────────────────────────────────┐
│              Adaptive Polling Strategy                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Base interval: 5 seconds                               │
│  Maximum interval: 60 seconds                           │
│  Minimum interval: 1 second                             │
│                                                         │
│  Adjustment rules:                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  IF consecutive_failures >= 3:                   │    │
│  │    interval = min(interval * 1.5, max_interval)  │    │
│  │  IF successful_sync AND interval > base:         │    │
│  │    interval = max(interval / 2, base_interval)   │    │
│  │  IF blockchain_height - local_height > 100:      │    │
│  │    interval = max(interval / 2, min_interval)    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Exponential backoff for failed result submissions:     │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Attempt 1: 1 second                             │    │
│  │  Attempt 2: 2 seconds                            │    │
│  │  Attempt 3: 4 seconds                            │    │
│  │  Attempt 4: 8 seconds                            │    │
│  │  Attempt 5: 16 seconds                           │    │
│  │  Attempt 6+: 30 seconds (cap)                    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Consequences

### 3.1 Positive Consequences

1. **Continuous operation during outages**: Provider nodes continue executing jobs and collecting metrics even when completely disconnected from the blockchain network. Results are buffered locally and submitted when connectivity is restored.

2. **Real-time updates when connected**: WebSocket event subscription provides immediate notification of blockchain state changes, eliminating polling latency and reducing unnecessary network traffic.

3. **Graceful degradation**: The system automatically transitions between connected, degraded, and offline modes without manual intervention. Each mode provides the best available level of synchronization.

4. **Idempotent operations**: All sync operations are designed to be safely retried, preventing duplicate submissions and ensuring consistency even after partial failures.

5. **Progress tracking**: The `last_synced_height` in local storage enables the node to resume sync from exactly where it left off, even after crashes or extended offline periods.

6. **Adaptive resource usage**: Polling intervals adjust based on network conditions, reducing resource consumption during prolonged outages while maintaining responsiveness when connectivity is restored.

7. **Deterministic conflict resolution**: The blockchain is always the source of truth. When local state conflicts with blockchain state, local state is overwritten, ensuring eventual consistency.

8. **Observable sync health**: Sync state is exposed through metrics and health checks, enabling monitoring and alerting on sync failures or prolonged offline periods.

### 3.2 Negative Consequences

1. **Implementation complexity**: The hybrid approach requires managing three sync modes, state transitions, and reconnection logic. This increases the codebase size and testing surface area.

2. **Event ordering challenges**: Blockchain events may arrive out of order or be duplicated. The sync layer must handle reordering and deduplication, adding complexity to event processing.

3. **Buffer growth during extended offline**: If a provider node is offline for days, the buffered results queue can grow significantly. This requires careful disk space management and pruning policies.

4. **Catch-up sync latency**: After extended offline periods, the catch-up sync may take significant time (proportional to the number of missed blocks). During this time, the node's local state is stale.

5. **WebSocket connection management**: WebSocket connections can be dropped by intermediaries (proxies, load balancers) without notification. The system must implement heartbeat/keepalive mechanisms and detect stale connections.

6. **Blockchain reorganization handling**: If the blockchain reorganizes (rare but possible), the node must detect the reorg and replay state changes from the fork point. This adds complexity to the catch-up sync logic.

### 3.3 Neutral Consequences

1. **Storage overhead**: The sync state tracking (last_synced_height, pending results, event log) adds approximately 10-50MB of storage overhead depending on offline duration.

2. **Network usage patterns**: Event-driven sync uses less bandwidth than continuous polling during normal operation, but catch-up sync after extended offline periods can generate significant traffic.

3. **Memory usage**: The event subscriber maintains an in-memory buffer of recent events for deduplication and ordering. This buffer is bounded (configurable, default 1000 events).

4. **Error handling complexity**: Each sync mode has its own error handling and recovery logic. The system must coordinate between modes to avoid conflicting recovery actions.

---

## 4. Architecture Diagrams

### 4.1 Sync State Machine

```
┌─────────────────────────────────────────────────────────┐
│              Sync State Machine (Detailed)               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    ┌─────────────┐                      │
│                    │  INITIALIZE │                      │
│                    └──────┬──────┘                      │
│                           │                             │
│                           ▼                             │
│                    ┌─────────────┐                      │
│              ┌────▶│  CONNECTED  │◀─────┐               │
│              │     │             │      │               │
│              │     │ • WebSocket │      │               │
│              │     │ • Events    │      │               │
│              │     │ • Real-time │      │               │
│              │     └──────┬──────┘      │               │
│              │            │             │               │
│              │  Connection│             │               │
│              │  Lost      │             │               │
│              │            ▼             │               │
│              │     ┌─────────────┐      │               │
│              │     │  DEGRADED   │      │               │
│              │     │             │      │               │
│              │     │ • Polling   │      │               │
│              │     │ • Adaptive  │      │               │
│              │     │ • Backoff   │      │               │
│              │     └──────┬──────┘      │               │
│              │            │             │               │
│              │  Polling   │             │               │
│              │  Fails     │             │               │
│              │  (3x)      │             │               │
│              │            ▼             │               │
│              │     ┌─────────────┐      │               │
│              └─────│   OFFLINE   │      │               │
│                    │             │      │               │
│                    │ • Local     │      │               │
│                    │   only      │      │               │
│                    │ • Buffer    │      │               │
│                    │   results   │      │               │
│                    └──────┬──────┘      │               │
│                           │             │               │
│                 Reconnect │             │               │
│                 + Catch-up│             │               │
│                 Sync      │             │               │
│                           ▼             │               │
│                    ┌─────────────┐      │               │
│                    │  CATCHING_UP│──────┘               │
│                    │             │   (back to            │
│                    │ • Block     │    CONNECTED)         │
│                    │   Replay    │                      │
│                    │ • Result    │                      │
│                    │   Submit    │                      │
│                    │ • State     │                      │
│                    │   Diff      │                      │
│                    └─────────────┘                      │
│                                                         │
│  State Transitions:                                     │
│  • INITIALIZE → CONNECTED: WebSocket connection success │
│  • CONNECTED → DEGRADED: WebSocket disconnect           │
│  • DEGRADED → CONNECTED: WebSocket reconnect            │
│  • DEGRADED → OFFLINE: 3 consecutive poll failures      │
│  • OFFLINE → CATCHING_UP: Reconnection detected         │
│  • CATCHING_UP → CONNECTED: Sync caught up              │
│  • CATCHING_UP → OFFLINE: Sync fails during catch-up    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Event Processing Pipeline

```
┌─────────────────────────────────────────────────────────┐
│              Event Processing Pipeline                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Blockchain Events                                      │
│         │                                               │
│         ▼                                               │
│  ┌─────────────────┐                                    │
│  │  Event Receiver │                                    │
│  │  (WebSocket)    │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Deduplication  │                                    │
│  │  (Event ID      │                                    │
│  │   tracking)     │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Ordering       │                                    │
│  │  (Block height  │                                    │
│  │   + tx index)   │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Validation     │                                    │
│  │  (Signature,    │                                    │
│  │   schema)       │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Event Router   │                                    │
│  │  (by type)      │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│     ┌─────┼─────────────┐                               │
│     │     │             │                               │
│     ▼     ▼             ▼                               │
│  ┌─────┐ ┌─────┐   ┌─────────┐                         │
│  │ Job │ │Rep. │   │Provider │                         │
│  │Event│ │Event│   │Event    │                         │
│  │Proc.│ │Proc.│   │Proc.    │                         │
│  └──┬──┘ └──┬──┘   └────┬────┘                         │
│     │       │           │                               │
│     └───────┼───────────┘                               │
│             │                                           │
│             ▼                                           │
│  ┌─────────────────┐                                    │
│  │  State Apply    │                                    │
│  │  (SQLite txn)   │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐                                    │
│  │  Ack + Update   │                                    │
│  │  last_synced    │                                    │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Offline Recovery Sequence

```
┌─────────────────────────────────────────────────────────┐
│              Offline Recovery Sequence                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Time ─────────────────────────────────────────▶        │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ CONNECTED│ │ OFFLINE  │ │ CATCHING │ │ CONNECTED│   │
│  │          │ │          │ │ _UP      │ │          │   │
│  │ • Normal │ │ • Jobs   │ │ • Replay │ │ • Normal │   │
│  │   sync   │ │   exec   │ │   blocks │ │   sync   │   │
│  │ • Events │ │ • Buffer │ │ • Submit │ │ • Events │   │
│  └──────────┘ │   results│ │   results│ └──────────┘   │
│               │ • Metrics│ │ • Diff   │                │
│               │   record │ │   state  │                │
│               └──────────┘ └──────────┘                │
│                                                         │
│  Local State:                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Current  │ │ Drifting │ │ Catching │ │ Current  │   │
│  │          │ │          │ │   up     │ │          │   │
│  │ last_sync│ │ last_sync│ │ last_sync│ │ last_sync│   │
│  │ = 1000   │ │ = 1000   │ │ → 1500   │ │ = 1500   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  Blockchain:                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Height   │ │ Height   │ │ Height   │ │ Height   │   │
│  │ = 1000   │ │ = 1500   │ │ = 1500   │ │ = 1500+  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  Buffered Results:                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Empty    │ │ Growing  │ │ Draining │ │ Empty    │   │
│  │          │ │          │ │          │ │          │   │
│  │ 0 pending│ │ 50 pend. │ │ 50 → 0   │ │ 0 pending│   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Code Examples

### 5.1 Sync Manager Implementation

```javascript
class BlockchainSyncManager {
  constructor(options) {
    this.localDb = options.localDb;
    this.blockchainRpc = options.blockchainRpc;
    this.providerId = options.providerId;
    
    // Configuration
    this.pollInterval = options.pollInterval || 5000;
    this.maxPollInterval = options.maxPollInterval || 60000;
    this.minPollInterval = options.minPollInterval || 1000;
    this.maxConsecutiveFailures = options.maxConsecutiveFailures || 3;
    this.catchUpBatchSize = options.catchUpBatchSize || 100;
    
    // State
    this.state = 'INITIALIZE';
    this.lastSyncedHeight = 0;
    this.consecutiveFailures = 0;
    this.currentPollInterval = this.pollInterval;
    this.websocket = null;
    this.pollTimer = null;
    this.catchUpInProgress = false;
    
    // Event handlers
    this.eventHandlers = new Map();
  }

  async initialize() {
    // Load last synced height
    const syncState = this.localDb.prepare(
      "SELECT value FROM sync_state WHERE key = 'last_synced_height'"
    ).get();
    
    this.lastSyncedHeight = syncState ? parseInt(syncState.value) : 0;
    
    // Register event handlers
    this.registerEventHandler('job_assigned', this.handleJobAssigned.bind(this));
    this.registerEventHandler('job_completed', this.handleJobCompleted.bind(this));
    this.registerEventHandler('reputation_updated', this.handleReputationUpdated.bind(this));
    
    // Start sync
    await this.connect();
  }

  async connect() {
    try {
      this.state = 'CONNECTED';
      await this.connectWebSocket();
      this.startEventProcessing();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.state = 'DEGRADED';
      this.startPolling();
    }
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const wsUrl = this.blockchainRpc.replace('http', 'ws') + '/websocket';
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.on('open', async () => {
        console.log('WebSocket connected');
        this.consecutiveFailures = 0;
        this.currentPollInterval = this.pollInterval;
        
        // Subscribe to relevant events
        await this.subscribeToEvents();
        resolve();
      });
      
      this.websocket.on('message', (data) => {
        this.processEvent(JSON.parse(data));
      });
      
      this.websocket.on('close', () => {
        console.log('WebSocket disconnected');
        this.state = 'DEGRADED';
        this.startPolling();
      });
      
      this.websocket.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);
    });
  }

  async subscribeToEvents() {
    const subscription = {
      jsonrpc: '2.0',
      method: 'subscribe',
      params: {
        query: `tm.event='Tx' AND job.provider_id='${this.providerId}'`,
      },
      id: 1,
    };
    
    this.websocket.send(JSON.stringify(subscription));
  }

  startPolling() {
    if (this.pollTimer) return;
    
    const poll = async () => {
      try {
        await this.sync();
        this.consecutiveFailures = 0;
        
        // Reduce interval on success
        if (this.currentPollInterval > this.pollInterval) {
          this.currentPollInterval = Math.max(
            this.pollInterval,
            this.currentPollInterval / 2
          );
        }
      } catch (error) {
        this.consecutiveFailures++;
        console.error(`Poll failed (${this.consecutiveFailures}/${this.maxConsecutiveFailures}):`, error);
        
        // Increase interval on failure
        this.currentPollInterval = Math.min(
          this.maxPollInterval,
          this.currentPollInterval * 1.5
        );
        
        // Transition to offline after max failures
        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          this.state = 'OFFLINE';
          console.warn('Transitioning to OFFLINE mode');
        }
      }
      
      // Schedule next poll
      this.pollTimer = setTimeout(poll, this.currentPollInterval);
    };
    
    poll();
  }

  async sync() {
    // Get current blockchain height
    const status = await this.getBlockchainStatus();
    const currentHeight = parseInt(status.result.sync_info.latest_block_height);
    
    if (currentHeight <= this.lastSyncedHeight) {
      return; // Already up to date
    }
    
    // Catch up if behind
    if (currentHeight - this.lastSyncedHeight > this.catchUpBatchSize) {
      await this.catchUpSync(currentHeight);
    } else {
      // Sync recent blocks
      for (let height = this.lastSyncedHeight + 1; height <= currentHeight; height++) {
        await this.processBlock(height);
      }
    }
    
    // Update sync state
    this.updateSyncState(currentHeight);
  }

  async catchUpSync(targetHeight) {
    if (this.catchUpInProgress) return;
    this.catchUpInProgress = true;
    this.state = 'CATCHING_UP';
    
    console.log(`Catching up from block ${this.lastSyncedHeight + 1} to ${targetHeight}`);
    
    try {
      for (
        let startHeight = this.lastSyncedHeight + 1;
        startHeight <= targetHeight;
        startHeight += this.catchUpBatchSize
      ) {
        const endHeight = Math.min(startHeight + this.catchUpBatchSize - 1, targetHeight);
        
        // Fetch blocks in batch
        const blocks = await this.getBlocks(startHeight, endHeight);
        
        for (const block of blocks) {
          await this.processBlock(block.header.height);
        }
        
        // Update progress
        this.updateSyncState(endHeight);
        
        // Yield to event loop
        await new Promise(resolve => setImmediate(resolve));
      }
      
      // Submit buffered results
      await this.submitBufferedResults();
      
    } finally {
      this.catchUpInProgress = false;
      this.state = 'CONNECTED';
    }
  }

  async processBlock(height) {
    const block = await this.getBlock(height);
    
    for (const txResult of block.block.results?.txs || []) {
      const events = this.extractEvents(txResult);
      
      for (const event of events) {
        if (this.isRelevantEvent(event)) {
          await this.processEvent(event);
        }
      }
    }
    
    this.lastSyncedHeight = height;
  }

  async processEvent(event) {
    const handler = this.eventHandlers.get(event.type);
    if (!handler) {
      console.warn(`No handler for event type: ${event.type}`);
      return;
    }
    
    try {
      await handler(event);
    } catch (error) {
      console.error(`Error processing event ${event.type}:`, error);
      throw error; // Re-throw to trigger retry
    }
  }

  async submitBufferedResults() {
    const pendingResults = this.localDb.prepare(`
      SELECT * FROM pending_results 
      ORDER BY created_at ASC
    `).all();
    
    console.log(`Submitting ${pendingResults.length} buffered results`);
    
    for (const result of pendingResults) {
      try {
        await this.submitResultToBlockchain(result);
        
        // Remove from pending
        this.localDb.prepare(
          'DELETE FROM pending_results WHERE id = ?'
        ).run(result.id);
        
      } catch (error) {
        console.error(`Failed to submit result ${result.id}:`, error);
        // Leave in pending queue for retry
      }
    }
  }

  registerEventHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
  }

  async handleJobAssigned(event) {
    const { jobId, model } = event.data;
    
    this.localDb.prepare(`
      INSERT OR REPLACE INTO jobs (job_id, model, status, assigned_at)
      VALUES (?, ?, 'assigned', strftime('%s', 'now'))
    `).run(jobId, model);
  }

  async handleJobCompleted(event) {
    const { jobId } = event.data;
    
    this.localDb.prepare(`
      UPDATE jobs SET status = 'completed', completed_at = strftime('%s', 'now')
      WHERE job_id = ?
    `).run(jobId);
  }

  async handleReputationUpdated(event) {
    const { providerId, newReputation } = event.data;
    
    if (providerId === this.providerId) {
      this.localDb.prepare(`
        INSERT OR REPLACE INTO provider_info (key, value, updated_at)
        VALUES ('reputation', ?, strftime('%s', 'now'))
      `).run(newReputation.toString());
    }
  }

  updateSyncState(height) {
    this.lastSyncedHeight = height;
    
    this.localDb.prepare(`
      INSERT OR REPLACE INTO sync_state (key, value, updated_at)
      VALUES ('last_synced_height', ?, strftime('%s', 'now'))
    `).run(height.toString());
  }

  isRelevantEvent(event) {
    // Check if event is relevant to this provider
    return event.data?.providerId === this.providerId ||
           event.type === 'governance_parameter_changed';
  }

  extractEvents(txResult) {
    // Parse Tendermint events from transaction result
    return txResult.events?.map(event => ({
      type: event.type,
      data: Object.fromEntries(
        event.attributes.map(attr => [attr.key, attr.value])
      ),
    })) || [];
  }

  async getBlockchainStatus() {
    const response = await fetch(`${this.blockchainRpc}/status`);
    return response.json();
  }

  async getBlock(height) {
    const response = await fetch(`${this.blockchainRpc}/block?height=${height}`);
    return response.json();
  }

  async getBlocks(startHeight, endHeight) {
    const blocks = [];
    for (let h = startHeight; h <= endHeight; h++) {
      blocks.push(await this.getBlock(h));
    }
    return blocks;
  }

  async submitResultToBlockchain(result) {
    // Submit job completion transaction to blockchain
    // Implementation depends on Cosmos SDK client
  }

  getHealthStatus() {
    return {
      state: this.state,
      lastSyncedHeight: this.lastSyncedHeight,
      consecutiveFailures: this.consecutiveFailures,
      currentPollInterval: this.currentPollInterval,
      catchUpInProgress: this.catchUpInProgress,
    };
  }

  async shutdown() {
    if (this.websocket) {
      this.websocket.close();
    }
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
  }
}
```

### 5.2 Conflict Resolution

```javascript
class SyncConflictResolver {
  constructor(localDb) {
    this.localDb = localDb;
  }

  /**
   * Resolve conflicts between local state and blockchain state.
   * Blockchain is always the source of truth.
   */
  async resolve(localState, blockchainState) {
    const conflicts = this.detectConflicts(localState, blockchainState);
    
    for (const conflict of conflicts) {
      await this.resolveConflict(conflict);
    }
    
    return conflicts;
  }

  detectConflicts(local, blockchain) {
    const conflicts = [];
    
    // Job status conflicts
    for (const [jobId, blockchainJob] of Object.entries(blockchain.jobs || {})) {
      const localJob = local.jobs?.[jobId];
      
      if (localJob && localJob.status !== blockchainJob.status) {
        conflicts.push({
          type: 'job_status',
          jobId,
          localValue: localJob.status,
          blockchainValue: blockchainJob.status,
          resolution: 'blockchain_wins',
        });
      }
    }
    
    // Reputation conflicts
    if (local.reputation !== blockchain.reputation) {
      conflicts.push({
        type: 'reputation',
        localValue: local.reputation,
        blockchainValue: blockchain.reputation,
        resolution: 'blockchain_wins',
      });
    }
    
    return conflicts;
  }

  async resolveConflict(conflict) {
    console.log(`Resolving conflict: ${conflict.type}`, conflict);
    
    switch (conflict.type) {
      case 'job_status':
        await this.localDb.prepare(`
          UPDATE jobs SET status = ? WHERE job_id = ?
        `).run(conflict.blockchainValue, conflict.jobId);
        break;
        
      case 'reputation':
        await this.localDb.prepare(`
          INSERT OR REPLACE INTO provider_info (key, value, updated_at)
          VALUES ('reputation', ?, strftime('%s', 'now'))
        `).run(conflict.blockchainValue.toString());
        break;
        
      default:
        console.warn(`Unknown conflict type: ${conflict.type}`);
    }
  }
}
```

---

## 6. Cross-References

### 6.1 Related ADRs

| ADR | Title | Relationship |
|-----|-------|-------------|
| [ADR-001](./ADR-001-storage-engine.md) | Storage Engine Selection | Defines local storage engines used by sync layer |
| [ADR-003](./ADR-003-query-language.md) | Query Language Design | Defines query patterns for sync state queries |

### 6.2 Related Documents

| Document | Path | Relationship |
|----------|------|-------------|
| SOTA Research | `docs/research/LOCAL_DATABASES_SOTA.md` | Offline-first architectures analysis |
| SPEC | `SPEC.md` | System specification with sync requirements |
| Provider Spec | `localbase/docs/provider_node_specification.md` | Provider node behavior specification |

### 6.3 External References

1. [Tendermint RPC Documentation](https://docs.tendermint.com/v0.34/rpc/)
2. [Cosmos SDK Events](https://docs.cosmos.network/main/build/building-modules/events)
3. [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
4. [Exponential Backoff Pattern](https://en.wikipedia.org/wiki/Exponential_backoff)

---

*ADR Version: 1.0.0*  
*Status: Accepted*  
*Last Updated: 2026-04-03*
