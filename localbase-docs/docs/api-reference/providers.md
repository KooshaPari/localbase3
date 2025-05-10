---
sidebar_position: 5
---

# Providers

The Providers API allows you to list and retrieve information about providers on the LocalBase platform.

## List Providers

```
GET /providers
```

Retrieves a list of providers available on the platform.

### Request

#### Headers

- `Authorization`: Your API key

#### Query Parameters

- `limit` (optional): The maximum number of providers to return (default: 20, max: 100)
- `offset` (optional): The number of providers to skip (default: 0)
- `model` (optional): Filter providers by supported model ID
- `status` (optional): Filter providers by status (e.g., "active", "inactive")
- `sort` (optional): Sort providers by a field (e.g., "reputation:desc", "price:asc")

### Response

```json
{
  "data": [
    {
      "id": "provider-1",
      "name": "Provider 1",
      "description": "High-performance AI compute provider",
      "endpoint": "https://provider1.example.com",
      "status": "active",
      "models": ["gpt-3.5-turbo", "gpt-4", "text-embedding-ada-002"],
      "reputation": 4.8,
      "uptime": 99.9,
      "price_range": {
        "min": 0.0015,
        "max": 0.03,
        "currency": "USD"
      },
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "provider-2",
      "name": "Provider 2",
      "description": "Budget-friendly AI compute provider",
      "endpoint": "https://provider2.example.com",
      "status": "active",
      "models": ["gpt-3.5-turbo"],
      "reputation": 4.5,
      "uptime": 99.5,
      "price_range": {
        "min": 0.001,
        "max": 0.002,
        "currency": "USD"
      },
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### Example

```bash
curl https://api.localbase.io/v1/providers?model=gpt-3.5-turbo&sort=price:asc \
  -H "Authorization: Bearer your-api-key"
```

## Retrieve a Provider

```
GET /providers/{id}
```

Retrieves information about a specific provider.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the provider to retrieve

### Response

```json
{
  "id": "provider-1",
  "name": "Provider 1",
  "description": "High-performance AI compute provider",
  "endpoint": "https://provider1.example.com",
  "status": "active",
  "models": [
    {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "price": 0.0015,
      "currency": "USD"
    },
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "price": 0.03,
      "currency": "USD"
    },
    {
      "id": "text-embedding-ada-002",
      "name": "Text Embedding Ada 002",
      "price": 0.0001,
      "currency": "USD"
    }
  ],
  "reputation": 4.8,
  "uptime": 99.9,
  "stats": {
    "jobs_completed": 10000,
    "jobs_failed": 50,
    "avg_response_time": 0.5,
    "avg_processing_time": 2.0
  },
  "hardware": {
    "gpu": "NVIDIA A100",
    "cpu": "AMD EPYC 7763",
    "memory": "512GB",
    "location": "US-West"
  },
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Example

```bash
curl https://api.localbase.io/v1/providers/provider-1 \
  -H "Authorization: Bearer your-api-key"
```

## Provider Models

```
GET /providers/{id}/models
```

Retrieves the models supported by a specific provider.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the provider

### Response

```json
{
  "data": [
    {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "description": "Most capable GPT-3.5 model and optimized for chat at 1/10th the cost of text-davinci-003.",
      "type": "text",
      "capabilities": ["chat", "completions"],
      "price": 0.0015,
      "currency": "USD",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "description": "More capable than any GPT-3.5 model, able to do more complex tasks, and optimized for chat.",
      "type": "text",
      "capabilities": ["chat", "completions"],
      "price": 0.03,
      "currency": "USD",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "text-embedding-ada-002",
      "name": "Text Embedding Ada 002",
      "description": "Improved embedding model that replaces five separate models for text search, text similarity, and code search.",
      "type": "embedding",
      "capabilities": ["embeddings"],
      "price": 0.0001,
      "currency": "USD",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### Example

```bash
curl https://api.localbase.io/v1/providers/provider-1/models \
  -H "Authorization: Bearer your-api-key"
```

## Provider Jobs

```
GET /providers/{id}/jobs
```

Retrieves the jobs processed by a specific provider.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the provider

#### Query Parameters

- `limit` (optional): The maximum number of jobs to return (default: 20, max: 100)
- `offset` (optional): The number of jobs to skip (default: 0)
- `status` (optional): Filter jobs by status (e.g., "pending", "completed", "failed")
- `model` (optional): Filter jobs by model ID
- `sort` (optional): Sort jobs by a field (e.g., "created_at:desc")

### Response

```json
{
  "data": [
    {
      "id": "job-123456",
      "model": "gpt-3.5-turbo",
      "type": "chat",
      "status": "completed",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:01Z",
      "completed_at": "2023-01-01T00:00:01Z",
      "cost": {
        "amount": 0.0015,
        "currency": "USD"
      },
      "processing_time": 0.5
    },
    {
      "id": "job-123457",
      "model": "gpt-4",
      "type": "chat",
      "status": "pending",
      "created_at": "2023-01-01T00:01:00Z",
      "updated_at": "2023-01-01T00:01:00Z",
      "completed_at": null,
      "cost": {
        "amount": 0.03,
        "currency": "USD"
      },
      "processing_time": null
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### Example

```bash
curl https://api.localbase.io/v1/providers/provider-1/jobs?status=completed&limit=10 \
  -H "Authorization: Bearer your-api-key"
```

## Provider Stats

```
GET /providers/{id}/stats
```

Retrieves statistics about a specific provider.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the provider

### Response

```json
{
  "jobs_completed": 10000,
  "jobs_failed": 50,
  "success_rate": 99.5,
  "avg_response_time": 0.5,
  "avg_processing_time": 2.0,
  "uptime": 99.9,
  "reputation": 4.8,
  "models_supported": 3,
  "jobs_by_model": {
    "gpt-3.5-turbo": 8000,
    "gpt-4": 1500,
    "text-embedding-ada-002": 500
  },
  "jobs_by_status": {
    "completed": 10000,
    "failed": 50,
    "cancelled": 20
  },
  "jobs_by_day": [
    {
      "date": "2023-01-01",
      "jobs": 1000
    },
    {
      "date": "2023-01-02",
      "jobs": 1200
    },
    {
      "date": "2023-01-03",
      "jobs": 1100
    }
  ]
}
```

### Example

```bash
curl https://api.localbase.io/v1/providers/provider-1/stats \
  -H "Authorization: Bearer your-api-key"
```

## Provider Status

Providers can have the following statuses:

- `active`: The provider is active and accepting jobs
- `inactive`: The provider is inactive and not accepting jobs
- `suspended`: The provider has been suspended and cannot accept jobs
- `maintenance`: The provider is undergoing maintenance and temporarily not accepting jobs

## Error Handling

If the provider is not found, the API will return a `404 Not Found` response:

```json
{
  "error": {
    "message": "Provider not found",
    "type": "not_found_error",
    "code": "provider_not_found"
  }
}
```

## Next Steps

Now that you understand how to work with providers, you can explore other API endpoints:

- [Models](models.md)
- [Jobs](jobs.md)
- [Users](users.md)
- [Billing](billing.md)
