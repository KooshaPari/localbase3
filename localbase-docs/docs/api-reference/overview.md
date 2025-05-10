---
sidebar_position: 1
---

# API Overview

LocalBase provides an OpenAI-compatible API for accessing AI models on the decentralized marketplace. This means you can use the same API calls you're familiar with from OpenAI, but with the benefits of LocalBase's decentralized infrastructure.

## Base URL

The base URL for the LocalBase API is:

```
https://api.localbase.io/v1
```

## Authentication

All API requests require authentication using an API key. You can obtain an API key from the [LocalBase Dashboard](https://app.localbase.io/settings/api-keys).

Include your API key in the `Authorization` header of your requests:

```
Authorization: Bearer your-api-key
```

## Rate Limits

LocalBase implements rate limiting to ensure fair usage of the platform. The rate limits are as follows:

- **Free Tier**: 60 requests per minute
- **Standard Tier**: 300 requests per minute
- **Enterprise Tier**: Custom rate limits

If you exceed the rate limit, you will receive a `429 Too Many Requests` response.

## Error Handling

The API returns standard HTTP status codes to indicate the success or failure of a request:

- `200 OK`: The request was successful
- `400 Bad Request`: The request was invalid
- `401 Unauthorized`: The API key is invalid or missing
- `403 Forbidden`: The API key does not have permission to perform the requested action
- `404 Not Found`: The requested resource was not found
- `429 Too Many Requests`: The rate limit was exceeded
- `500 Internal Server Error`: An error occurred on the server

Error responses include a JSON object with an `error` field containing details about the error:

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "authentication_error",
    "code": "invalid_api_key"
  }
}
```

## Endpoints

LocalBase provides the following API endpoints:

### Chat Completions

- `POST /chat/completions`: Create a chat completion
- `GET /chat/completions/{id}`: Retrieve a chat completion

### Completions

- `POST /completions`: Create a completion
- `GET /completions/{id}`: Retrieve a completion

### Embeddings

- `POST /embeddings`: Create embeddings
- `GET /embeddings/{id}`: Retrieve embeddings

### Models

- `GET /models`: List available models
- `GET /models/{id}`: Retrieve a model

### Jobs

- `GET /jobs`: List jobs
- `GET /jobs/{id}`: Retrieve a job
- `POST /jobs/{id}/cancel`: Cancel a job

### Providers

- `GET /providers`: List providers
- `GET /providers/{id}`: Retrieve a provider

### Users

- `GET /users/me`: Retrieve the current user
- `GET /users/me/usage`: Retrieve the current user's usage

### Billing

- `GET /billing/usage`: Retrieve billing usage
- `GET /billing/invoices`: List invoices
- `GET /billing/invoices/{id}`: Retrieve an invoice

## Pagination

Endpoints that return lists of objects support pagination using the `limit` and `offset` query parameters:

- `limit`: The maximum number of objects to return (default: 20, max: 100)
- `offset`: The number of objects to skip (default: 0)

The response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

## Filtering

Some endpoints support filtering using query parameters. For example, you can filter jobs by status:

```
GET /jobs?status=completed
```

## Sorting

Some endpoints support sorting using the `sort` query parameter. For example, you can sort jobs by creation date:

```
GET /jobs?sort=created_at:desc
```

## Webhooks

LocalBase supports webhooks for receiving notifications about events. You can configure webhooks in the [LocalBase Dashboard](https://app.localbase.io/settings/webhooks).

Webhook events include:

- `job.created`: A job was created
- `job.completed`: A job was completed
- `job.failed`: A job failed
- `job.cancelled`: A job was cancelled

## SDKs

LocalBase provides SDKs for popular programming languages:

- [JavaScript/TypeScript](https://github.com/localbase/localbase-js)
- [Python](https://github.com/localbase/localbase-python)
- [Go](https://github.com/localbase/localbase-go)
- [Ruby](https://github.com/localbase/localbase-ruby)
- [PHP](https://github.com/localbase/localbase-php)
- [Java](https://github.com/localbase/localbase-java)
- [C#](https://github.com/localbase/localbase-csharp)

## Next Steps

Explore the specific API endpoints:

- [Authentication](authentication.md)
- [Models](models.md)
- [Jobs](jobs.md)
- [Providers](providers.md)
- [Users](users.md)
- [Billing](billing.md)
- [SDK](sdk.md)
