# Functional Requirements — localbase3

## Overview

LocalBase is a decentralized AI compute marketplace built on Cosmos SDK with OpenRouter-compatible API and React frontend. This document defines the core functional requirements.

## Functional Requirements

### FR-LB-001: Provider Registration & Discovery

**Description:** GPU providers can register with the marketplace, publish their capabilities, and be discoverable by clients.

**Acceptance Criteria:**
- Providers submit capability data (GPU model, VRAM, location, pricing)
- Provider list queryable via API
- Providers can update pricing and availability status
- Provider metrics tracked (uptime, response time)

**Related Tests:** `tests/provider_registration.rs`, `localbase-blockchain/tests/provider_discovery_test.go`

---

### FR-LB-002: Compute Job Submission & Routing

**Description:** Clients submit AI compute jobs (LLM inference, finetuning) which are routed to optimal providers based on requirements and availability.

**Acceptance Criteria:**
- Jobs include model name, parameters, input data
- Routing algorithm considers provider capabilities, location, cost
- Jobs queued when no matching providers available
- Job status trackable (pending, running, completed, failed)

**Related Tests:** `localbase-api/tests/job_routing_test.ts`, `tests/routing_algorithm.rs`

---

### FR-LB-003: OpenRouter API Compatibility

**Description:** LocalBase API implements OpenRouter-compatible endpoints for seamless integration with existing AI tools.

**Acceptance Criteria:**
- `/v1/chat/completions` endpoint compatible with OpenRouter spec
- `Authorization: Bearer <token>` auth supported
- Model parameter routing to local providers
- Response format matches OpenRouter JSON schema

**Related Tests:** `localbase-api/tests/openrouter_compat_test.ts`

---

### FR-LB-004: Blockchain Settlement & Payment

**Description:** Jobs completed on-chain with payment settled via Cosmos SDK tokens.

**Acceptance Criteria:**
- Job completion logged to blockchain
- Provider receives payment (minus marketplace fee)
- Client charged based on compute units used
- Payment disputes resolvable via multi-sig

**Related Tests:** `localbase-blockchain/tests/settlement_test.go`

---

### FR-LB-005: Frontend Job Management UI

**Description:** React frontend allows clients to monitor jobs, providers, and marketplace health.

**Acceptance Criteria:**
- Dashboard shows active jobs, completion rates, costs
- Provider map/list view with filtering
- Job detail view with logs and metrics
- Real-time updates via WebSocket

**Related Tests:** `localbase-frontend/tests/dashboard.test.tsx`

---

### FR-LB-006: Security & Rate Limiting

**Description:** API enforces authentication, rate limiting, and DDoS protection.

**Acceptance Criteria:**
- API keys validated on all endpoints
- Rate limits enforced per client
- Marketplace rejects malicious job payloads
- Audit log of all transactions

**Related Tests:** `tests/security_test.rs`, `localbase-api/tests/rate_limit_test.ts`

---

### FR-LB-007: Provider Monitoring & Health

**Description:** System monitors provider health and automatically removes unhealthy providers from routing.

**Acceptance Criteria:**
- Health checks run on 30s interval
- Failed providers marked unavailable after 3 consecutive failures
- Provider metrics (latency, error rate) published to dashboard
- Alerts triggered for providers exceeding SLA thresholds

**Related Tests:** `tests/provider_health_test.rs`

---

### FR-LB-008: Cross-Cloud Provider Support

**Description:** Support GPU providers from multiple cloud platforms (AWS, GCP, Azure, self-hosted).

**Acceptance Criteria:**
- Provider software compatible with major cloud GPU offerings
- Multi-region provider discovery
- Location-aware routing (latency optimization)
- Provider metadata includes cloud platform and region

**Related Tests:** `localbase-provider/tests/cloud_integration_test.go`

---

## Test Traceability

All FRs MUST have corresponding test coverage:
- Unit tests: Core functionality validation
- Integration tests: End-to-end workflows
- Security tests: Auth, rate limiting, input validation
- Performance tests: Routing latency, throughput

Run tests with: `npm test` (frontend), `cargo test` (core), `go test ./...` (blockchain)

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-24  
**Status:** Active  
