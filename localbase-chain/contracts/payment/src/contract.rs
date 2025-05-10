use cosmwasm_std::{
    to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Addr, Uint128,
    CosmosMsg, WasmMsg, BankMsg, coin,
};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Payment {
    pub job_id: String,
    pub creator: Addr,
    pub provider: Addr,
    pub amount: Uint128,
    pub status: String,
    pub created_at: u64,
    pub completed_at: Option<u64>,
    pub refunded_at: Option<u64>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub job_manager_contract: String,
    pub provider_registry_contract: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
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
    WithdrawFunds {
        amount: Uint128,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetPayment {
        job_id: String,
    },
    ListPayments {
        start_after: Option<String>,
        limit: Option<u32>,
    },
    ListPaymentsByCreator {
        creator: String,
        start_after: Option<String>,
        limit: Option<u32>,
    },
    ListPaymentsByProvider {
        provider: String,
        start_after: Option<String>,
        limit: Option<u32>,
    },
    GetBalance {
        address: String,
    },
}

// State
pub const ADMIN: Item<Addr> = Item::new("admin");
pub const JOB_MANAGER_CONTRACT: Item<Addr> = Item::new("job_manager_contract");
pub const PROVIDER_REGISTRY_CONTRACT: Item<Addr> = Item::new("provider_registry_contract");
pub const PAYMENTS: Map<&str, Payment> = Map::new("payments");
pub const CREATOR_PAYMENTS: Map<(&str, &str), bool> = Map::new("creator_payments");
pub const PROVIDER_PAYMENTS: Map<(&str, &str), bool> = Map::new("provider_payments");

pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let admin = msg.admin.map_or(info.sender.clone(), |admin| deps.api.addr_validate(&admin)?);
    ADMIN.save(deps.storage, &admin)?;

    let job_manager_contract = deps.api.addr_validate(&msg.job_manager_contract)?;
    JOB_MANAGER_CONTRACT.save(deps.storage, &job_manager_contract)?;

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
        ExecuteMsg::CreatePayment { job_id, provider_id } => {
            execute_create_payment(deps, env, info, job_id, provider_id)
        }
        ExecuteMsg::CompletePayment { job_id, amount } => {
            execute_complete_payment(deps, env, info, job_id, amount)
        }
        ExecuteMsg::RefundPayment { job_id } => {
            execute_refund_payment(deps, env, info, job_id)
        }
        ExecuteMsg::WithdrawFunds { amount } => {
            execute_withdraw_funds(deps, env, info, amount)
        }
    }
}

pub fn execute_create_payment(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
    provider_id: String,
) -> StdResult<Response> {
    // Ensure sender is the job manager contract
    let job_manager_contract = JOB_MANAGER_CONTRACT.load(deps.storage)?;
    if info.sender != job_manager_contract {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Ensure payment doesn't already exist
    if PAYMENTS.has(deps.storage, &job_id) {
        return Err(cosmwasm_std::StdError::generic_err("Payment already exists"));
    }

    // Get provider from registry
    let provider_registry_contract = PROVIDER_REGISTRY_CONTRACT.load(deps.storage)?;
    let provider: ProviderResponse = deps.querier.query_wasm_smart(
        provider_registry_contract,
        &ProviderQueryMsg::GetProvider {
            provider_id: provider_id.clone(),
        },
    )?;

    // Create payment
    let payment = Payment {
        job_id: job_id.clone(),
        creator: info.sender.clone(),
        provider: provider.owner,
        amount: Uint128::zero(),
        status: "pending".to_string(),
        created_at: env.block.time.seconds(),
        completed_at: None,
        refunded_at: None,
    };

    // Save payment
    PAYMENTS.save(deps.storage, &job_id, &payment)?;

    // Save creator and provider mappings
    CREATOR_PAYMENTS.save(deps.storage, (info.sender.as_str(), &job_id), &true)?;
    PROVIDER_PAYMENTS.save(deps.storage, (payment.provider.as_str(), &job_id), &true)?;

    Ok(Response::new()
        .add_attribute("method", "create_payment")
        .add_attribute("job_id", job_id)
        .add_attribute("provider_id", provider_id))
}

pub fn execute_complete_payment(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
    amount: Uint128,
) -> StdResult<Response> {
    // Ensure sender is the job manager contract
    let job_manager_contract = JOB_MANAGER_CONTRACT.load(deps.storage)?;
    if info.sender != job_manager_contract {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Get payment
    let mut payment = PAYMENTS.load(deps.storage, &job_id)?;

    // Ensure payment is pending
    if payment.status != "pending" {
        return Err(cosmwasm_std::StdError::generic_err("Payment is not pending"));
    }

    // Update payment
    payment.amount = amount;
    payment.status = "completed".to_string();
    payment.completed_at = Some(env.block.time.seconds());

    // Save updated payment
    PAYMENTS.save(deps.storage, &job_id, &payment)?;

    // Send payment to provider
    let send_msg = BankMsg::Send {
        to_address: payment.provider.to_string(),
        amount: vec![coin(amount.u128(), "ulb")],
    };

    Ok(Response::new()
        .add_message(CosmosMsg::Bank(send_msg))
        .add_attribute("method", "complete_payment")
        .add_attribute("job_id", job_id)
        .add_attribute("amount", amount.to_string()))
}

pub fn execute_refund_payment(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    job_id: String,
) -> StdResult<Response> {
    // Ensure sender is the job manager contract
    let job_manager_contract = JOB_MANAGER_CONTRACT.load(deps.storage)?;
    if info.sender != job_manager_contract {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Get payment
    let mut payment = PAYMENTS.load(deps.storage, &job_id)?;

    // Ensure payment is pending
    if payment.status != "pending" {
        return Err(cosmwasm_std::StdError::generic_err("Payment is not pending"));
    }

    // Update payment
    payment.status = "refunded".to_string();
    payment.refunded_at = Some(env.block.time.seconds());

    // Save updated payment
    PAYMENTS.save(deps.storage, &job_id, &payment)?;

    // No funds to refund since we're using an escrow model
    // In a real implementation, we would refund any escrowed funds

    Ok(Response::new()
        .add_attribute("method", "refund_payment")
        .add_attribute("job_id", job_id))
}

pub fn execute_withdraw_funds(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> StdResult<Response> {
    // Ensure sender is the admin
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Get contract balance
    let balance = deps.querier.query_balance(env.contract.address.clone(), "ulb")?;

    // Ensure sufficient balance
    if balance.amount < amount {
        return Err(cosmwasm_std::StdError::generic_err("Insufficient balance"));
    }

    // Send funds to admin
    let send_msg = BankMsg::Send {
        to_address: admin.to_string(),
        amount: vec![coin(amount.u128(), "ulb")],
    };

    Ok(Response::new()
        .add_message(CosmosMsg::Bank(send_msg))
        .add_attribute("method", "withdraw_funds")
        .add_attribute("amount", amount.to_string()))
}

pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetPayment { job_id } => to_binary(&query_payment(deps, job_id)?),
        QueryMsg::ListPayments { start_after, limit } => {
            to_binary(&query_list_payments(deps, start_after, limit)?)
        }
        QueryMsg::ListPaymentsByCreator { creator, start_after, limit } => {
            to_binary(&query_list_payments_by_creator(deps, creator, start_after, limit)?)
        }
        QueryMsg::ListPaymentsByProvider { provider, start_after, limit } => {
            to_binary(&query_list_payments_by_provider(deps, provider, start_after, limit)?)
        }
        QueryMsg::GetBalance { address } => to_binary(&query_balance(deps, address)?),
    }
}

fn query_payment(deps: Deps, job_id: String) -> StdResult<Payment> {
    PAYMENTS.load(deps.storage, &job_id)
}

fn query_list_payments(
    deps: Deps,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<(String, Payment)>> {
    let limit = limit.unwrap_or(10) as usize;
    let start = start_after.map(|s| s.as_bytes().to_vec());

    PAYMENTS
        .range(deps.storage, start, None, cosmwasm_std::Order::Ascending)
        .take(limit)
        .map(|item| {
            let (k, v) = item?;
            Ok((String::from_utf8(k)?, v))
        })
        .collect()
}

fn query_list_payments_by_creator(
    deps: Deps,
    creator: String,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<(String, Payment)>> {
    let limit = limit.unwrap_or(10) as usize;
    let addr = deps.api.addr_validate(&creator)?;
    let start = start_after.map(|s| (creator.as_str(), s.as_str()));

    let job_ids: Vec<String> = CREATOR_PAYMENTS
        .prefix(addr.as_str())
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

    let mut payments = Vec::new();
    for job_id in job_ids {
        let payment = PAYMENTS.load(deps.storage, &job_id)?;
        payments.push((job_id, payment));
    }

    Ok(payments)
}

fn query_list_payments_by_provider(
    deps: Deps,
    provider: String,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<(String, Payment)>> {
    let limit = limit.unwrap_or(10) as usize;
    let addr = deps.api.addr_validate(&provider)?;
    let start = start_after.map(|s| (provider.as_str(), s.as_str()));

    let job_ids: Vec<String> = PROVIDER_PAYMENTS
        .prefix(addr.as_str())
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

    let mut payments = Vec::new();
    for job_id in job_ids {
        let payment = PAYMENTS.load(deps.storage, &job_id)?;
        payments.push((job_id, payment));
    }

    Ok(payments)
}

fn query_balance(deps: Deps, address: String) -> StdResult<Uint128> {
    let addr = deps.api.addr_validate(&address)?;
    let balance = deps.querier.query_balance(addr, "ulb")?;
    Ok(balance.amount)
}

// External contract messages and responses

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
