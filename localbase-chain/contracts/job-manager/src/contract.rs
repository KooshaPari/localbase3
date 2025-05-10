use cosmwasm_std::{
    to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Addr, Uint128,
    CosmosMsg, WasmMsg, BankMsg, coin,
};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Job {
    pub creator: Addr,
    pub provider_id: String,
    pub model: String,
    pub input: String,
    pub parameters: String,
    pub result: Option<String>,
    pub status: String,
    pub error: Option<String>,
    pub usage: Option<Usage>,
    pub cost: Option<Uint128>,
    pub payment_id: Option<String>,
    pub created_at: u64,
    pub started_at: Option<u64>,
    pub completed_at: Option<u64>,
    pub failed_at: Option<u64>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Usage {
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub total_tokens: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub payment_contract: String,
    pub provider_registry_contract: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    CreateJob {
        provider_id: String,
        model: String,
        input: String,
        parameters: String,
    },
    StartJob {
        job_id: String,
    },
    CompleteJob {
        job_id: String,
        result: String,
        usage: Usage,
    },
    FailJob {
        job_id: String,
        error: String,
    },
    CancelJob {
        job_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetJob {
        job_id: String,
    },
    ListJobs {
        start_after: Option<String>,
        limit: Option<u32>,
    },
    ListJobsByProvider {
        provider_id: String,
        start_after: Option<String>,
        limit: Option<u32>,
    },
    ListJobsByCreator {
        creator: String,
        start_after: Option<String>,
        limit: Option<u32>,
    },
}

// State
pub const ADMIN: Item<Addr> = Item::new("admin");
pub const PAYMENT_CONTRACT: Item<Addr> = Item::new("payment_contract");
pub const PROVIDER_REGISTRY_CONTRACT: Item<Addr> = Item::new("provider_registry_contract");
pub const JOBS: Map<&str, Job> = Map::new("jobs");
pub const PROVIDER_JOBS: Map<(&str, &str), bool> = Map::new("provider_jobs");
pub const CREATOR_JOBS: Map<(&str, &str), bool> = Map::new("creator_jobs");

pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let admin = msg.admin.map_or(info.sender.clone(), |admin| deps.api.addr_validate(&admin)?);
    ADMIN.save(deps.storage, &admin)?;

    let payment_contract = deps.api.addr_validate(&msg.payment_contract)?;
    PAYMENT_CONTRACT.save(deps.storage, &payment_contract)?;

    let provider_registry_contract = deps.api.addr_validate(&msg.provider_registry_contract)?;
    PROVIDER_REGISTRY_CONTRACT.save(deps.storage, &provider_registry_contract)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", admin))
}

pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::CreateJob {
            provider_id,
            model,
            input,
            parameters,
        } => execute_create_job(deps, env, info, provider_id, model, input, parameters),
        ExecuteMsg::StartJob { job_id } => execute_start_job(deps, env, info, job_id),
        ExecuteMsg::CompleteJob { job_id, result, usage } => {
            execute_complete_job(deps, env, info, job_id, result, usage)
        }
        ExecuteMsg::FailJob { job_id, error } => execute_fail_job(deps, env, info, job_id, error),
        ExecuteMsg::CancelJob { job_id } => execute_cancel_job(deps, env, info, job_id),
    }
}

pub fn execute_create_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    provider_id: String,
    model: String,
    input: String,
    parameters: String,
) -> StdResult<Response> {
    // Validate inputs
    if provider_id.is_empty() {
        return Err(cosmwasm_std::StdError::generic_err("Provider ID cannot be empty"));
    }
    if model.is_empty() {
        return Err(cosmwasm_std::StdError::generic_err("Model cannot be empty"));
    }
    if input.is_empty() {
        return Err(cosmwasm_std::StdError::generic_err("Input cannot be empty"));
    }

    // Generate job ID
    let job_id = format!("job_{}", env.block.height);

    // Create job
    let job = Job {
        creator: info.sender.clone(),
        provider_id: provider_id.clone(),
        model,
        input,
        parameters,
        result: None,
        status: "pending".to_string(),
        error: None,
        usage: None,
        cost: None,
        payment_id: None,
        created_at: env.block.time.seconds(),
        started_at: None,
        completed_at: None,
        failed_at: None,
    };

    // Save job
    JOBS.save(deps.storage, &job_id, &job)?;

    // Save provider to job mapping
    PROVIDER_JOBS.save(deps.storage, (&provider_id, &job_id), &true)?;

    // Save creator to job mapping
    CREATOR_JOBS.save(deps.storage, (info.sender.as_str(), &job_id), &true)?;

    // Create payment
    let payment_contract = PAYMENT_CONTRACT.load(deps.storage)?;
    let create_payment_msg = WasmMsg::Execute {
        contract_addr: payment_contract.to_string(),
        msg: to_binary(&PaymentExecuteMsg::CreatePayment {
            job_id: job_id.clone(),
            provider_id: provider_id.clone(),
        })?,
        funds: info.funds,
    };

    Ok(Response::new()
        .add_message(CosmosMsg::Wasm(create_payment_msg))
        .add_attribute("method", "create_job")
        .add_attribute("job_id", job_id)
        .add_attribute("creator", info.sender)
        .add_attribute("provider_id", provider_id))
}

pub fn execute_start_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
) -> StdResult<Response> {
    // Get job
    let mut job = JOBS.load(deps.storage, &job_id)?;

    // Check if job is in pending status
    if job.status != "pending" {
        return Err(cosmwasm_std::StdError::generic_err("Job is not in pending status"));
    }

    // Check if sender is the provider
    let provider_registry_contract = PROVIDER_REGISTRY_CONTRACT.load(deps.storage)?;
    let provider: ProviderResponse = deps.querier.query_wasm_smart(
        provider_registry_contract,
        &ProviderQueryMsg::GetProvider {
            provider_id: job.provider_id.clone(),
        },
    )?;

    if info.sender != provider.owner {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Update job status
    job.status = "processing".to_string();
    job.started_at = Some(env.block.time.seconds());

    // Save updated job
    JOBS.save(deps.storage, &job_id, &job)?;

    Ok(Response::new()
        .add_attribute("method", "start_job")
        .add_attribute("job_id", job_id))
}

pub fn execute_complete_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
    result: String,
    usage: Usage,
) -> StdResult<Response> {
    // Get job
    let mut job = JOBS.load(deps.storage, &job_id)?;

    // Check if job is in processing status
    if job.status != "processing" {
        return Err(cosmwasm_std::StdError::generic_err("Job is not in processing status"));
    }

    // Check if sender is the provider
    let provider_registry_contract = PROVIDER_REGISTRY_CONTRACT.load(deps.storage)?;
    let provider: ProviderResponse = deps.querier.query_wasm_smart(
        provider_registry_contract,
        &ProviderQueryMsg::GetProvider {
            provider_id: job.provider_id.clone(),
        },
    )?;

    if info.sender != provider.owner {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Update job
    job.status = "completed".to_string();
    job.result = Some(result);
    job.usage = Some(usage);
    job.completed_at = Some(env.block.time.seconds());

    // Calculate cost
    let total_tokens = usage.input_tokens + usage.output_tokens;
    let cost = Uint128::from(total_tokens);
    job.cost = Some(cost);

    // Save updated job
    JOBS.save(deps.storage, &job_id, &job)?;

    // Complete payment
    let payment_contract = PAYMENT_CONTRACT.load(deps.storage)?;
    let complete_payment_msg = WasmMsg::Execute {
        contract_addr: payment_contract.to_string(),
        msg: to_binary(&PaymentExecuteMsg::CompletePayment {
            job_id: job_id.clone(),
            amount: cost,
        })?,
        funds: vec![],
    };

    // Update reputation
    let update_reputation_msg = WasmMsg::Execute {
        contract_addr: provider_registry_contract.to_string(),
        msg: to_binary(&ProviderExecuteMsg::UpdateReputation {
            provider_id: job.provider_id.clone(),
            job_id: job_id.clone(),
            success: true,
            latency: env.block.time.seconds() - job.started_at.unwrap_or(job.created_at),
        })?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(CosmosMsg::Wasm(complete_payment_msg))
        .add_message(CosmosMsg::Wasm(update_reputation_msg))
        .add_attribute("method", "complete_job")
        .add_attribute("job_id", job_id))
}

pub fn execute_fail_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
    error: String,
) -> StdResult<Response> {
    // Get job
    let mut job = JOBS.load(deps.storage, &job_id)?;

    // Check if job is in pending or processing status
    if job.status != "pending" && job.status != "processing" {
        return Err(cosmwasm_std::StdError::generic_err("Job is not in pending or processing status"));
    }

    // Check if sender is the provider
    let provider_registry_contract = PROVIDER_REGISTRY_CONTRACT.load(deps.storage)?;
    let provider: ProviderResponse = deps.querier.query_wasm_smart(
        provider_registry_contract,
        &ProviderQueryMsg::GetProvider {
            provider_id: job.provider_id.clone(),
        },
    )?;

    if info.sender != provider.owner {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Update job
    job.status = "failed".to_string();
    job.error = Some(error);
    job.failed_at = Some(env.block.time.seconds());

    // Save updated job
    JOBS.save(deps.storage, &job_id, &job)?;

    // Refund payment
    let payment_contract = PAYMENT_CONTRACT.load(deps.storage)?;
    let refund_payment_msg = WasmMsg::Execute {
        contract_addr: payment_contract.to_string(),
        msg: to_binary(&PaymentExecuteMsg::RefundPayment {
            job_id: job_id.clone(),
        })?,
        funds: vec![],
    };

    // Update reputation
    let update_reputation_msg = WasmMsg::Execute {
        contract_addr: provider_registry_contract.to_string(),
        msg: to_binary(&ProviderExecuteMsg::UpdateReputation {
            provider_id: job.provider_id.clone(),
            job_id: job_id.clone(),
            success: false,
            latency: 0,
        })?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(CosmosMsg::Wasm(refund_payment_msg))
        .add_message(CosmosMsg::Wasm(update_reputation_msg))
        .add_attribute("method", "fail_job")
        .add_attribute("job_id", job_id))
}

pub fn execute_cancel_job(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
) -> StdResult<Response> {
    // Get job
    let mut job = JOBS.load(deps.storage, &job_id)?;

    // Check if job is in pending status
    if job.status != "pending" {
        return Err(cosmwasm_std::StdError::generic_err("Job is not in pending status"));
    }

    // Check if sender is the creator or admin
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != job.creator && info.sender != admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Update job
    job.status = "cancelled".to_string();
    job.failed_at = Some(env.block.time.seconds());

    // Save updated job
    JOBS.save(deps.storage, &job_id, &job)?;

    // Refund payment
    let payment_contract = PAYMENT_CONTRACT.load(deps.storage)?;
    let refund_payment_msg = WasmMsg::Execute {
        contract_addr: payment_contract.to_string(),
        msg: to_binary(&PaymentExecuteMsg::RefundPayment {
            job_id: job_id.clone(),
        })?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(CosmosMsg::Wasm(refund_payment_msg))
        .add_attribute("method", "cancel_job")
        .add_attribute("job_id", job_id))
}

pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetJob { job_id } => to_binary(&query_job(deps, job_id)?),
        QueryMsg::ListJobs { start_after, limit } => {
            to_binary(&query_list_jobs(deps, start_after, limit)?)
        }
        QueryMsg::ListJobsByProvider { provider_id, start_after, limit } => {
            to_binary(&query_list_jobs_by_provider(deps, provider_id, start_after, limit)?)
        }
        QueryMsg::ListJobsByCreator { creator, start_after, limit } => {
            to_binary(&query_list_jobs_by_creator(deps, creator, start_after, limit)?)
        }
    }
}

fn query_job(deps: Deps, job_id: String) -> StdResult<Job> {
    JOBS.load(deps.storage, &job_id)
}

fn query_list_jobs(
    deps: Deps,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<(String, Job)>> {
    let limit = limit.unwrap_or(10) as usize;
    let start = start_after.map(|s| s.as_bytes().to_vec());

    JOBS
        .range(deps.storage, start, None, cosmwasm_std::Order::Ascending)
        .take(limit)
        .map(|item| {
            let (k, v) = item?;
            Ok((String::from_utf8(k)?, v))
        })
        .collect()
}

fn query_list_jobs_by_provider(
    deps: Deps,
    provider_id: String,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<(String, Job)>> {
    let limit = limit.unwrap_or(10) as usize;
    let start = start_after.map(|s| (provider_id.as_str(), s.as_str()));

    let job_ids: Vec<String> = PROVIDER_JOBS
        .prefix(provider_id.as_str())
        .range(
            deps.storage,
            start.map(|(p, s)| s.as_bytes().to_vec()),
            None,
            cosmwasm_std::Order::Ascending,
        )
        .take(limit)
        .map(|item| {
            let (k, _) = item?;
            Ok(String::from_utf8(k)?)
        })
        .collect::<StdResult<Vec<String>>>()?;

    let mut jobs = Vec::new();
    for job_id in job_ids {
        let job = JOBS.load(deps.storage, &job_id)?;
        jobs.push((job_id, job));
    }

    Ok(jobs)
}

fn query_list_jobs_by_creator(
    deps: Deps,
    creator: String,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<(String, Job)>> {
    let limit = limit.unwrap_or(10) as usize;
    let start = start_after.map(|s| (creator.as_str(), s.as_str()));

    let job_ids: Vec<String> = CREATOR_JOBS
        .prefix(creator.as_str())
        .range(
            deps.storage,
            start.map(|(c, s)| s.as_bytes().to_vec()),
            None,
            cosmwasm_std::Order::Ascending,
        )
        .take(limit)
        .map(|item| {
            let (k, _) = item?;
            Ok(String::from_utf8(k)?)
        })
        .collect::<StdResult<Vec<String>>>()?;

    let mut jobs = Vec::new();
    for job_id in job_ids {
        let job = JOBS.load(deps.storage, &job_id)?;
        jobs.push((job_id, job));
    }

    Ok(jobs)
}

// External contract messages and responses

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum PaymentExecuteMsg {
    CreatePayment {
        job_id: String,
        provider_id: String,
    },
    CompletePayment {
        job_id: String,
        amount: Uint128,
    },
    RefundPayment {
        job_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ProviderExecuteMsg {
    UpdateReputation {
        provider_id: String,
        job_id: String,
        success: bool,
        latency: u64,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ProviderQueryMsg {
    GetProvider {
        provider_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ProviderResponse {
    pub owner: Addr,
    pub name: String,
    pub hardware_info: HardwareInfo,
    pub benchmark_results: BenchmarkResults,
    pub models_supported: Vec<String>,
    pub pricing: Vec<ModelPricing>,
    pub status: String,
    pub region: String,
    pub avg_response_time: u64,
    pub reputation: Uint128,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct HardwareInfo {
    pub gpu_type: String,
    pub vram: String,
    pub cpu_cores: u32,
    pub ram: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct BenchmarkResults {
    pub inference_speed: u64,
    pub max_batch_size: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ModelPricing {
    pub model: String,
    pub input_price_per_token: Uint128,
    pub output_price_per_token: Uint128,
}
