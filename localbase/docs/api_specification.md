# LocalBase API Specification

## Overview

The LocalBase API provides an OpenAI-compatible interface for accessing decentralized AI compute resources. This specification outlines the endpoints, request/response formats, and authentication mechanisms for interacting with the LocalBase network.

## API Compatibility

The LocalBase API is designed to be compatible with the OpenAI API, allowing for easy integration with existing tools and libraries that support OpenAI's interface. This compatibility enables users to switch from centralized providers to LocalBase's decentralized marketplace with minimal code changes.

## Base URL

```
https://api.localbase.network/v1
```

## Authentication

Authentication is performed using API keys, similar to OpenAI's approach:

```
Authorization: Bearer lb_sk_xxxxxxxxxxxxxxxxxxxx
```

API keys can be generated and managed through the LocalBase dashboard.

## Endpoints

### Models

#### List Models

```
GET /models
```

Returns a list of available models on the LocalBase network.

**Response Format:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "lb-llama-3-70b",
      "object": "model",
      "created": 1698969600,
      "owned_by": "localbase",
      "providers": [
        {
          "id": "provider_1",
          "reputation": 0.98,
          "price_per_token": 0.00000005,
          "avg_response_time": 150
        },
        {
          "id": "provider_2",
          "reputation": 0.95,
          "price_per_token": 0.00000004,
          "avg_response_time": 180
        }
      ]
    },
    {
      "id": "lb-mixtral-8x7b",
      "object": "model",
      "created": 1698969600,
      "owned_by": "localbase"
    }
  ]
}
```

#### Retrieve Model

```
GET /models/{model_id}
```

Returns information about a specific model.

**Response Format:**

```json
{
  "id": "lb-llama-3-70b",
  "object": "model",
  "created": 1698969600,
  "owned_by": "localbase",
  "providers": [
    {
      "id": "provider_1",
      "reputation": 0.98,
      "price_per_token": 0.00000005,
      "avg_response_time": 150,
      "hardware": {
        "gpu_type": "NVIDIA RTX 4090",
        "vram": "24GB"
      }
    }
  ]
}
```

### Chat Completions

#### Create Chat Completion

```
POST /chat/completions
```

Creates a completion for the chat message.

**Request Format:**

```json
{
  "model": "lb-llama-3-70b",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 150,
  "provider_preferences": {
    "min_reputation": 0.9,
    "max_price_per_token": 0.0000001,
    "preferred_provider_id": "provider_1"
  }
}
```

**Response Format:**

```json
{
  "id": "chatcmpl-123456789",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "lb-llama-3-70b",
  "provider_id": "provider_1",
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 30,
    "total_tokens": 50
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}
```

### Completions

#### Create Completion

```
POST /completions
```

Creates a completion for the provided prompt.

**Request Format:**

```json
{
  "model": "lb-llama-3-70b",
  "prompt": "Once upon a time",
  "max_tokens": 150,
  "temperature": 0.7,
  "provider_preferences": {
    "min_reputation": 0.9,
    "max_price_per_token": 0.0000001
  }
}
```

**Response Format:**

```json
{
  "id": "cmpl-123456789",
  "object": "text_completion",
  "created": 1699000000,
  "model": "lb-llama-3-70b",
  "provider_id": "provider_1",
  "choices": [
    {
      "text": " in a land far away, there lived a brave knight who...",
      "index": 0,
      "finish_reason": "length"
    }
  ],
  "usage": {
    "prompt_tokens": 4,
    "completion_tokens": 16,
    "total_tokens": 20
  }
}
```

### Embeddings

#### Create Embeddings

```
POST /embeddings
```

Creates embeddings for the provided input text.

**Request Format:**

```json
{
  "model": "lb-embedding-ada-002",
  "input": "The food was delicious and the service was excellent."
}
```

**Response Format:**

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.0023064255, -0.009327292, ...],
      "index": 0
    }
  ],
  "model": "lb-embedding-ada-002",
  "provider_id": "provider_3",
  "usage": {
    "prompt_tokens": 10,
    "total_tokens": 10
  }
}
```

### Providers

#### List Providers

```
GET /providers
```

Returns a list of active providers on the network.

**Response Format:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "provider_1",
      "created": 1698969600,
      "hardware": {
        "gpu_type": "NVIDIA RTX 4090",
        "vram": "24GB",
        "cpu_cores": 16,
        "ram": "64GB"
      },
      "benchmark_results": {
        "inference_speed": 120,
        "max_batch_size": 8
      },
      "reputation": 0.98,
      "models_supported": ["lb-llama-3-70b", "lb-mixtral-8x7b"],
      "pricing": {
        "lb-llama-3-70b": {
          "input_price_per_token": 0.00000002,
          "output_price_per_token": 0.00000005
        }
      },
      "status": "active"
    }
  ]
}
```

#### Get Provider

```
GET /providers/{provider_id}
```

Returns information about a specific provider.

**Response Format:**

```json
{
  "id": "provider_1",
  "created": 1698969600,
  "hardware": {
    "gpu_type": "NVIDIA RTX 4090",
    "vram": "24GB",
    "cpu_cores": 16,
    "ram": "64GB"
  },
  "benchmark_results": {
    "inference_speed": 120,
    "max_batch_size": 8
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
  "performance_history": {
    "uptime_percentage": 99.8,
    "avg_response_time": 150,
    "completed_jobs": 15420
  }
}
```

### Jobs

#### List Jobs

```
GET /jobs
```

Returns a list of jobs submitted by the authenticated user.

**Response Format:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "job_123456789",
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
  ]
}
```

#### Get Job

```
GET /jobs/{job_id}
```

Returns information about a specific job.

**Response Format:**

```json
{
  "id": "job_123456789",
  "created": 1699000000,
  "model": "lb-llama-3-70b",
  "provider_id": "provider_1",
  "status": "completed",
  "request": {
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 150
  },
  "response": {
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "Hello! How can I assist you today?"
        },
        "finish_reason": "stop",
        "index": 0
      }
    ]
  },
  "cost": {
    "input_tokens": 20,
    "output_tokens": 30,
    "input_cost": 0.0000004,
    "output_cost": 0.0000015,
    "total_cost": 0.0000019
  },
  "completion_time": 1699000010,
  "processing_time_ms": 250
}
```

## LocalBase-Specific Extensions

While maintaining OpenAI API compatibility, LocalBase adds several extensions to leverage the decentralized nature of the platform:

### Provider Preferences

When making inference requests, users can specify provider preferences:

```json
"provider_preferences": {
  "min_reputation": 0.9,
  "max_price_per_token": 0.0000001,
  "preferred_provider_id": "provider_1",
  "max_response_time_ms": 500,
  "region": "us-west"
}
```

### Batch Processing

For large workloads, users can submit batch jobs:

```
POST /batch/completions
```

**Request Format:**

```json
{
  "model": "lb-llama-3-70b",
  "batch": [
    {
      "prompt": "Summarize the following text: ...",
      "max_tokens": 150
    },
    {
      "prompt": "Translate the following to French: ...",
      "max_tokens": 200
    }
  ],
  "provider_preferences": {
    "min_reputation": 0.9
  }
}
```

### Provider Bidding

For cost-sensitive workloads, users can request bids from providers:

```
POST /bids/completions
```

**Request Format:**

```json
{
  "model": "lb-llama-3-70b",
  "messages": [
    {
      "role": "user",
      "content": "Generate a 1000-word essay about climate change."
    }
  ],
  "max_tokens": 1500,
  "bid_timeout_seconds": 30,
  "max_bids": 5
}
```

**Response Format:**

```json
{
  "bids": [
    {
      "provider_id": "provider_1",
      "estimated_cost": 0.00015,
      "estimated_completion_time_ms": 3500,
      "reputation": 0.98,
      "bid_id": "bid_123456789"
    },
    {
      "provider_id": "provider_2",
      "estimated_cost": 0.00012,
      "estimated_completion_time_ms": 4200,
      "reputation": 0.95,
      "bid_id": "bid_987654321"
    }
  ]
}
```

To accept a bid:

```
POST /bids/{bid_id}/accept
```

## Error Handling

LocalBase follows the OpenAI error format:

```json
{
  "error": {
    "message": "The model 'lb-nonexistent-model' does not exist",
    "type": "invalid_request_error",
    "param": "model",
    "code": "model_not_found"
  }
}
```

Common error types include:

- `invalid_request_error`: The request was malformed or invalid
- `authentication_error`: Authentication failed
- `permission_error`: The API key doesn't have permission
- `rate_limit_error`: Rate limit exceeded
- `provider_error`: Error from the provider
- `service_unavailable`: Service temporarily unavailable

## Rate Limits

Rate limits are based on:

1. User tier (free, basic, premium)
2. Token usage per minute
3. Requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9500
X-RateLimit-Reset: 1699001000
```

## Versioning

The API follows semantic versioning. Breaking changes will be introduced in new major versions (e.g., v2).

## Webhooks

Users can register webhooks to receive notifications about job status changes:

```
POST /webhooks
```

**Request Format:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["job.completed", "job.failed"],
  "secret": "whsec_xxxxxxxxxxxxxxxx"
}
```

Webhook payloads are signed using the webhook secret to verify authenticity.
