---
sidebar_position: 3
---

# Smart Contracts

The LocalBase blockchain uses CosmWasm smart contracts to implement key functionality. This guide explains the smart contracts used in the LocalBase ecosystem, their purpose, and how they work.

## What is CosmWasm?

CosmWasm is a smart contracting platform built for the Cosmos ecosystem. It allows for the development of secure, portable, and efficient smart contracts using WebAssembly (Wasm).

Key features of CosmWasm include:

- **Security**: CosmWasm is designed with security in mind, with a strong focus on preventing common vulnerabilities.
- **Efficiency**: Wasm is a binary instruction format that is designed to be compact and execute at near-native speed.
- **Portability**: CosmWasm contracts can be deployed on any blockchain that supports the CosmWasm module.
- **Rust Support**: CosmWasm contracts are typically written in Rust, a language known for its safety and performance.

## Provider Registry Contract

The Provider Registry contract manages provider registration, staking, and reputation.

### Contract State

```rust
// State
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub min_stake: Uint128,
    pub max_fee: Uint128,
    pub min_uptime: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Provider {
    pub owner: Addr,
    pub name: String,
    pub description: String,
    pub endpoint: String,
    pub stake: Uint128,
    pub fee: Uint128,
    pub models: Vec<String>,
    pub uptime: u64,
    pub reputation: u64,
    pub registered_at: Timestamp,
    pub last_active: Timestamp,
    pub status: ProviderStatus,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum ProviderStatus {
    Active,
    Inactive,
    Suspended,
}
```

### Key Functions

#### Register Provider

Allows a provider to register on the network by staking tokens and providing information about their service.

```rust
pub fn execute_register_provider(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    name: String,
    description: String,
    endpoint: String,
    fee: Uint128,
    models: Vec<String>,
) -> StdResult<Response> {
    // Check if provider already exists
    // Check if stake is sufficient
    // Check if fee is within limits
    // Create and save provider
}
```

#### Update Provider

Allows a provider to update their information, such as name, description, endpoint, fee, and supported models.

```rust
pub fn execute_update_provider(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    name: Option<String>,
    description: Option<String>,
    endpoint: Option<String>,
    fee: Option<Uint128>,
    models: Option<Vec<String>>,
) -> StdResult<Response> {
    // Check if provider exists
    // Update provider fields
    // Save updated provider
}
```

#### Add Stake

Allows a provider to add more stake to their account.

```rust
pub fn execute_add_stake(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> StdResult<Response> {
    // Check if provider exists
    // Calculate additional stake
    // Update provider stake
    // Save updated provider
}
```

#### Withdraw Stake

Allows a provider to withdraw stake from their account, as long as the remaining stake is above the minimum required.

```rust
pub fn execute_withdraw_stake(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> StdResult<Response> {
    // Check if provider exists
    // Check if withdrawal amount is valid
    // Check if remaining stake is sufficient
    // Update provider stake
    // Create bank send message to return stake
}
```

#### Update Status

Allows the admin to update a provider's status (Active, Inactive, Suspended).

```rust
pub fn execute_update_status(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    provider: String,
    status: ProviderStatus,
) -> StdResult<Response> {
    // Check if caller is admin
    // Check if provider exists
    // Update provider status
    // Save updated provider
}
```

#### Update Uptime

Allows the admin to update a provider's uptime.

```rust
pub fn execute_update_uptime(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    provider: String,
    uptime: u64,
) -> StdResult<Response> {
    // Check if caller is admin
    // Check if uptime is valid
    // Check if provider exists
    // Update provider uptime
    // Check if provider should be suspended due to low uptime
    // Save updated provider
}
```

#### Update Reputation

Allows the admin to update a provider's reputation.

```rust
pub fn execute_update_reputation(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    provider: String,
    reputation: u64,
) -> StdResult<Response> {
    // Check if caller is admin
    // Check if reputation is valid
    // Check if provider exists
    // Update provider reputation
    // Save updated provider
}
```

### Queries

The Provider Registry contract supports the following queries:

- **GetConfig**: Get the contract configuration
- **GetProvider**: Get information about a specific provider
- **ListProviders**: List all providers
- **ListProvidersByModel**: List providers that support a specific model

## Job Management Contract

The Job Management contract handles job creation, assignment, execution, and payment.

### Contract State

```rust
// State
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub provider_registry: Addr,
    pub fee_percentage: u64,
    pub min_job_fee: Uint128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Job {
    pub id: String,
    pub user: Addr,
    pub provider: Addr,
    pub model: String,
    pub input: String,
    pub parameters: String,
    pub output: Option<String>,
    pub error: Option<String>,
    pub fee: Uint128,
    pub status: JobStatus,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub completed_at: Option<Timestamp>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum JobStatus {
    Pending,
    Assigned,
    Processing,
    Completed,
    Failed,
    Cancelled,
}
```

### Key Functions

#### Create Job

Allows a user to create a new job by specifying the model, input, and parameters.

```rust
pub fn execute_create_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    model: String,
    input: String,
    parameters: String,
) -> StdResult<Response> {
    // Generate job ID
    // Check if fee is sufficient
    // Find suitable provider
    // Create job
    // Save job
    // Hold fee in escrow
}
```

#### Assign Job

Assigns a job to a provider.

```rust
pub fn execute_assign_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
    provider: String,
) -> StdResult<Response> {
    // Check if caller is admin
    // Check if job exists and is pending
    // Check if provider exists and is active
    // Update job status to assigned
    // Save updated job
}
```

#### Start Job

Allows a provider to start processing a job.

```rust
pub fn execute_start_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
) -> StdResult<Response> {
    // Check if job exists and is assigned to the caller
    // Update job status to processing
    // Save updated job
}
```

#### Complete Job

Allows a provider to mark a job as completed and provide the output.

```rust
pub fn execute_complete_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
    output: String,
) -> StdResult<Response> {
    // Check if job exists and is processing
    // Check if caller is the assigned provider
    // Update job status to completed
    // Set job output
    // Save updated job
    // Release fee to provider
}
```

#### Fail Job

Allows a provider to mark a job as failed and provide an error message.

```rust
pub fn execute_fail_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
    error: String,
) -> StdResult<Response> {
    // Check if job exists and is processing
    // Check if caller is the assigned provider
    // Update job status to failed
    // Set job error
    // Save updated job
    // Return fee to user
}
```

#### Cancel Job

Allows a user to cancel a job that hasn't been completed yet.

```rust
pub fn execute_cancel_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
) -> StdResult<Response> {
    // Check if job exists and is not completed
    // Check if caller is the job creator
    // Update job status to cancelled
    // Save updated job
    // Return fee to user
}
```

### Queries

The Job Management contract supports the following queries:

- **GetConfig**: Get the contract configuration
- **GetJob**: Get information about a specific job
- **ListJobs**: List all jobs
- **ListJobsByUser**: List jobs created by a specific user
- **ListJobsByProvider**: List jobs assigned to a specific provider
- **ListJobsByStatus**: List jobs with a specific status

## Model Registry Contract

The Model Registry contract manages information about available models on the network.

### Contract State

```rust
// State
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Model {
    pub id: String,
    pub name: String,
    pub description: String,
    pub type_: String,
    pub capabilities: Vec<String>,
    pub parameters: String,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}
```

### Key Functions

#### Register Model

Allows the admin to register a new model.

```rust
pub fn execute_register_model(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: String,
    name: String,
    description: String,
    type_: String,
    capabilities: Vec<String>,
    parameters: String,
) -> StdResult<Response> {
    // Check if caller is admin
    // Check if model already exists
    // Create model
    // Save model
}
```

#### Update Model

Allows the admin to update an existing model.

```rust
pub fn execute_update_model(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: String,
    name: Option<String>,
    description: Option<String>,
    type_: Option<String>,
    capabilities: Option<Vec<String>>,
    parameters: Option<String>,
) -> StdResult<Response> {
    // Check if caller is admin
    // Check if model exists
    // Update model fields
    // Save updated model
}
```

#### Remove Model

Allows the admin to remove a model.

```rust
pub fn execute_remove_model(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: String,
) -> StdResult<Response> {
    // Check if caller is admin
    // Check if model exists
    // Remove model
}
```

### Queries

The Model Registry contract supports the following queries:

- **GetConfig**: Get the contract configuration
- **GetModel**: Get information about a specific model
- **ListModels**: List all models
- **ListModelsByType**: List models of a specific type
- **ListModelsByCapability**: List models with a specific capability

## Governance Contract

The Governance contract enables on-chain governance for the LocalBase network.

### Contract State

```rust
// State
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub voting_period: u64,
    pub quorum: Decimal,
    pub threshold: Decimal,
    pub veto_threshold: Decimal,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Proposal {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub proposer: Addr,
    pub status: ProposalStatus,
    pub final_tally: Option<Tally>,
    pub deposit: Uint128,
    pub submit_time: Timestamp,
    pub deposit_end_time: Timestamp,
    pub voting_start_time: Option<Timestamp>,
    pub voting_end_time: Option<Timestamp>,
    pub execution_time: Option<Timestamp>,
    pub messages: Vec<CosmosMsg>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum ProposalStatus {
    DepositPeriod,
    VotingPeriod,
    Passed,
    Rejected,
    Failed,
    Executed,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Tally {
    pub yes: Uint128,
    pub no: Uint128,
    pub abstain: Uint128,
    pub veto: Uint128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum VoteOption {
    Yes,
    No,
    Abstain,
    Veto,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Vote {
    pub proposal_id: u64,
    pub voter: Addr,
    pub option: VoteOption,
    pub weight: Uint128,
}
```

### Key Functions

#### Submit Proposal

Allows a user to submit a governance proposal.

```rust
pub fn execute_submit_proposal(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    title: String,
    description: String,
    messages: Vec<CosmosMsg>,
) -> StdResult<Response> {
    // Check if deposit is sufficient
    // Generate proposal ID
    // Create proposal
    // Save proposal
}
```

#### Deposit

Allows a user to deposit tokens for a proposal in the deposit period.

```rust
pub fn execute_deposit(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    proposal_id: u64,
) -> StdResult<Response> {
    // Check if proposal exists and is in deposit period
    // Calculate deposit amount
    // Update proposal deposit
    // Check if deposit threshold is reached
    // If threshold reached, move proposal to voting period
    // Save updated proposal
}
```

#### Vote

Allows a user to vote on a proposal in the voting period.

```rust
pub fn execute_vote(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    proposal_id: u64,
    option: VoteOption,
) -> StdResult<Response> {
    // Check if proposal exists and is in voting period
    // Check if user has already voted
    // Calculate vote weight based on staked tokens
    // Create vote
    // Save vote
    // Update tally
}
```

#### End Voting

Ends the voting period for a proposal and tallies the votes.

```rust
pub fn execute_end_voting(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    proposal_id: u64,
) -> StdResult<Response> {
    // Check if proposal exists and is in voting period
    // Check if voting period has ended
    // Tally votes
    // Determine proposal status based on tally
    // Update proposal status
    // Save updated proposal
}
```

#### Execute Proposal

Executes a passed proposal.

```rust
pub fn execute_execute_proposal(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    proposal_id: u64,
) -> StdResult<Response> {
    // Check if proposal exists and is passed
    // Update proposal status to executed
    // Save updated proposal
    // Execute proposal messages
}
```

### Queries

The Governance contract supports the following queries:

- **GetConfig**: Get the contract configuration
- **GetProposal**: Get information about a specific proposal
- **ListProposals**: List all proposals
- **ListProposalsByStatus**: List proposals with a specific status
- **GetVote**: Get a specific vote
- **ListVotes**: List all votes for a proposal

## Next Steps

To learn more about the LocalBase blockchain, check out the following guides:

- [Governance](governance.md): How governance works on the blockchain
- [Tokenomics](tokenomics.md): Token economics of the blockchain
- [Validators](validators.md): How to run a validator node
