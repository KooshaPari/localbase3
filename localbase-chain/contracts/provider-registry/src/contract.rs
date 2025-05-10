use cosmwasm_std::{
    to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Addr, Uint128,
};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Provider {
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

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub admin: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    RegisterProvider {
        name: String,
        hardware_info: HardwareInfo,
        benchmark_results: BenchmarkResults,
        models_supported: Vec<String>,
        pricing: Vec<ModelPricing>,
        region: String,
    },
    UpdateProvider {
        provider_id: String,
        name: Option<String>,
        hardware_info: Option<HardwareInfo>,
        benchmark_results: Option<BenchmarkResults>,
        models_supported: Option<Vec<String>>,
        pricing: Option<Vec<ModelPricing>>,
        status: Option<String>,
        region: Option<String>,
    },
    SetProviderStatus {
        provider_id: String,
        status: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetProvider {
        provider_id: String,
    },
    ListProviders {
        start_after: Option<String>,
        limit: Option<u32>,
    },
    ListProvidersByModel {
        model: String,
        start_after: Option<String>,
        limit: Option<u32>,
    },
}

// State
pub const ADMIN: Item<Addr> = Item::new("admin");
pub const PROVIDERS: Map<&str, Provider> = Map::new("providers");
pub const MODEL_PROVIDERS: Map<(&str, &str), bool> = Map::new("model_providers");

pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let admin = msg.admin.map_or(info.sender.clone(), |admin| deps.api.addr_validate(&admin)?);
    ADMIN.save(deps.storage, &admin)?;

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
        ExecuteMsg::RegisterProvider {
            name,
            hardware_info,
            benchmark_results,
            models_supported,
            pricing,
            region,
        } => execute_register_provider(
            deps,
            env,
            info,
            name,
            hardware_info,
            benchmark_results,
            models_supported,
            pricing,
            region,
        ),
        ExecuteMsg::UpdateProvider {
            provider_id,
            name,
            hardware_info,
            benchmark_results,
            models_supported,
            pricing,
            status,
            region,
        } => execute_update_provider(
            deps,
            env,
            info,
            provider_id,
            name,
            hardware_info,
            benchmark_results,
            models_supported,
            pricing,
            status,
            region,
        ),
        ExecuteMsg::SetProviderStatus { provider_id, status } => {
            execute_set_provider_status(deps, env, info, provider_id, status)
        }
    }
}

pub fn execute_register_provider(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    name: String,
    hardware_info: HardwareInfo,
    benchmark_results: BenchmarkResults,
    models_supported: Vec<String>,
    pricing: Vec<ModelPricing>,
    region: String,
) -> StdResult<Response> {
    // Generate provider ID
    let provider_id = format!("provider_{}", env.block.height);

    // Validate inputs
    if name.is_empty() {
        return Err(cosmwasm_std::StdError::generic_err("Provider name cannot be empty"));
    }
    if models_supported.is_empty() {
        return Err(cosmwasm_std::StdError::generic_err("Provider must support at least one model"));
    }
    if pricing.is_empty() {
        return Err(cosmwasm_std::StdError::generic_err("Provider must have pricing for at least one model"));
    }

    // Create provider
    let provider = Provider {
        owner: info.sender.clone(),
        name,
        hardware_info,
        benchmark_results,
        models_supported: models_supported.clone(),
        pricing,
        status: "active".to_string(),
        region,
        avg_response_time: 0,
        reputation: Uint128::from(95u128), // Default reputation 0.95 * 100
        created_at: env.block.time.seconds(),
        updated_at: env.block.time.seconds(),
    };

    // Save provider
    PROVIDERS.save(deps.storage, &provider_id, &provider)?;

    // Save model to provider mappings
    for model in models_supported {
        MODEL_PROVIDERS.save(deps.storage, (&model, &provider_id), &true)?;
    }

    Ok(Response::new()
        .add_attribute("method", "register_provider")
        .add_attribute("provider_id", provider_id)
        .add_attribute("owner", info.sender))
}

pub fn execute_update_provider(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    provider_id: String,
    name: Option<String>,
    hardware_info: Option<HardwareInfo>,
    benchmark_results: Option<BenchmarkResults>,
    models_supported: Option<Vec<String>>,
    pricing: Option<Vec<ModelPricing>>,
    status: Option<String>,
    region: Option<String>,
) -> StdResult<Response> {
    // Get provider
    let mut provider = PROVIDERS.load(deps.storage, &provider_id)?;

    // Check if sender is the owner
    if info.sender != provider.owner {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Update provider fields
    if let Some(name) = name {
        if name.is_empty() {
            return Err(cosmwasm_std::StdError::generic_err("Provider name cannot be empty"));
        }
        provider.name = name;
    }
    if let Some(hardware_info) = hardware_info {
        provider.hardware_info = hardware_info;
    }
    if let Some(benchmark_results) = benchmark_results {
        provider.benchmark_results = benchmark_results;
    }
    if let Some(models_supported) = models_supported {
        if models_supported.is_empty() {
            return Err(cosmwasm_std::StdError::generic_err("Provider must support at least one model"));
        }
        
        // Remove old model to provider mappings
        for model in &provider.models_supported {
            MODEL_PROVIDERS.remove(deps.storage, (model, &provider_id));
        }
        
        // Add new model to provider mappings
        for model in &models_supported {
            MODEL_PROVIDERS.save(deps.storage, (model, &provider_id), &true)?;
        }
        
        provider.models_supported = models_supported;
    }
    if let Some(pricing) = pricing {
        if pricing.is_empty() {
            return Err(cosmwasm_std::StdError::generic_err("Provider must have pricing for at least one model"));
        }
        provider.pricing = pricing;
    }
    if let Some(status) = status {
        if status != "active" && status != "inactive" && status != "pending" {
            return Err(cosmwasm_std::StdError::generic_err("Invalid status"));
        }
        provider.status = status;
    }
    if let Some(region) = region {
        provider.region = region;
    }

    // Update timestamp
    provider.updated_at = env.block.time.seconds();

    // Save updated provider
    PROVIDERS.save(deps.storage, &provider_id, &provider)?;

    Ok(Response::new()
        .add_attribute("method", "update_provider")
        .add_attribute("provider_id", provider_id))
}

pub fn execute_set_provider_status(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    provider_id: String,
    status: String,
) -> StdResult<Response> {
    // Get provider
    let mut provider = PROVIDERS.load(deps.storage, &provider_id)?;

    // Check if sender is the owner or admin
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != provider.owner && info.sender != admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }

    // Validate status
    if status != "active" && status != "inactive" && status != "pending" {
        return Err(cosmwasm_std::StdError::generic_err("Invalid status"));
    }

    // Update status
    provider.status = status.clone();
    provider.updated_at = env.block.time.seconds();

    // Save updated provider
    PROVIDERS.save(deps.storage, &provider_id, &provider)?;

    Ok(Response::new()
        .add_attribute("method", "set_provider_status")
        .add_attribute("provider_id", provider_id)
        .add_attribute("status", status))
}

pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetProvider { provider_id } => to_binary(&query_provider(deps, provider_id)?),
        QueryMsg::ListProviders { start_after, limit } => {
            to_binary(&query_list_providers(deps, start_after, limit)?)
        }
        QueryMsg::ListProvidersByModel { model, start_after, limit } => {
            to_binary(&query_list_providers_by_model(deps, model, start_after, limit)?)
        }
    }
}

fn query_provider(deps: Deps, provider_id: String) -> StdResult<Provider> {
    PROVIDERS.load(deps.storage, &provider_id)
}

fn query_list_providers(
    deps: Deps,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<(String, Provider)>> {
    let limit = limit.unwrap_or(10) as usize;
    let start = start_after.map(|s| s.as_bytes().to_vec());

    PROVIDERS
        .range(deps.storage, start, None, cosmwasm_std::Order::Ascending)
        .take(limit)
        .map(|item| {
            let (k, v) = item?;
            Ok((String::from_utf8(k)?, v))
        })
        .collect()
}

fn query_list_providers_by_model(
    deps: Deps,
    model: String,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<(String, Provider)>> {
    let limit = limit.unwrap_or(10) as usize;
    let start = start_after.map(|s| (model.as_str(), s.as_str()));

    let provider_ids: Vec<String> = MODEL_PROVIDERS
        .prefix(model.as_str())
        .range(
            deps.storage,
            start.map(|(m, s)| s.as_bytes().to_vec()),
            None,
            cosmwasm_std::Order::Ascending,
        )
        .take(limit)
        .map(|item| {
            let (k, _) = item?;
            Ok(String::from_utf8(k)?)
        })
        .collect::<StdResult<Vec<String>>>()?;

    let mut providers = Vec::new();
    for provider_id in provider_ids {
        let provider = PROVIDERS.load(deps.storage, &provider_id)?;
        providers.push((provider_id, provider));
    }

    Ok(providers)
}
