---
sidebar_position: 4
---

# Jobs

The Jobs API allows you to create, retrieve, and manage jobs on the LocalBase platform.

## Create a Job

```
POST /jobs
```

Creates a new job on the platform.

### Request

#### Headers

- `Authorization`: Your API key
- `Content-Type`: `application/json`

#### Body

```json
{
  "model": "gpt-3.5-turbo",
  "input": {
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, world!"}
    ]
  },
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 100
  },
  "type": "chat",
  "provider_id": "provider-1",  // Optional: Specify a provider
  "timeout": 60  // Optional: Timeout in seconds
}
```

#### Parameters

- `model` (required): The ID of the model to use
- `input` (required): The input data for the job (format depends on the model)
- `parameters` (optional): Model-specific parameters
- `type` (optional): The type of job (default: determined by model)
- `provider_id` (optional): The ID of the provider to use (if not specified, the platform will select a provider)
- `timeout` (optional): Timeout in seconds (default: 60)

### Response

```json
{
  "id": "job-123456",
  "model": "gpt-3.5-turbo",
  "type": "chat",
  "status": "pending",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "provider_id": "provider-1",
  "input": {
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, world!"}
    ]
  },
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 100
  },
  "result": null,
  "error": null,
  "cost": {
    "amount": 0.0015,
    "currency": "USD"
  },
  "timeout": 60
}
```

### Example

```bash
curl https://api.localbase.io/v1/jobs \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "input": {
      "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, world!"}
      ]
    },
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 100
    }
  }'
```

## Retrieve a Job

```
GET /jobs/{id}
```

Retrieves information about a specific job.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the job to retrieve

### Response

```json
{
  "id": "job-123456",
  "model": "gpt-3.5-turbo",
  "type": "chat",
  "status": "completed",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:01Z",
  "completed_at": "2023-01-01T00:00:01Z",
  "provider_id": "provider-1",
  "input": {
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, world!"}
    ]
  },
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 100
  },
  "result": {
    "message": {
      "role": "assistant",
      "content": "Hello! How can I assist you today?"
    }
  },
  "error": null,
  "cost": {
    "amount": 0.0015,
    "currency": "USD"
  },
  "processing_time": 0.5,
  "timeout": 60
}
```

### Example

```bash
curl https://api.localbase.io/v1/jobs/job-123456 \
  -H "Authorization: Bearer your-api-key"
```

## List Jobs

```
GET /jobs
```

Retrieves a list of jobs.

### Request

#### Headers

- `Authorization`: Your API key

#### Query Parameters

- `limit` (optional): The maximum number of jobs to return (default: 20, max: 100)
- `offset` (optional): The number of jobs to skip (default: 0)
- `status` (optional): Filter jobs by status (e.g., "pending", "completed", "failed")
- `model` (optional): Filter jobs by model ID
- `provider_id` (optional): Filter jobs by provider ID
- `type` (optional): Filter jobs by type
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
      "provider_id": "provider-1",
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
      "provider_id": "provider-2",
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
curl https://api.localbase.io/v1/jobs?status=completed&limit=10 \
  -H "Authorization: Bearer your-api-key"
```

## Cancel a Job

```
POST /jobs/{id}/cancel
```

Cancels a job that is pending or processing.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the job to cancel

### Response

```json
{
  "id": "job-123456",
  "model": "gpt-3.5-turbo",
  "type": "chat",
  "status": "cancelled",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:02Z",
  "completed_at": null,
  "provider_id": "provider-1",
  "input": {
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, world!"}
    ]
  },
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 100
  },
  "result": null,
  "error": null,
  "cost": {
    "amount": 0,
    "currency": "USD"
  },
  "processing_time": null,
  "timeout": 60
}
```

### Example

```bash
curl -X POST https://api.localbase.io/v1/jobs/job-123456/cancel \
  -H "Authorization: Bearer your-api-key"
```

## Job Status

Jobs can have the following statuses:

- `pending`: The job has been created but not yet assigned to a provider
- `assigned`: The job has been assigned to a provider but not yet started
- `processing`: The job is being processed by the provider
- `completed`: The job has been completed successfully
- `failed`: The job has failed
- `cancelled`: The job has been cancelled by the user

## Job Types

Jobs can have the following types:

- `chat`: Chat completion job
- `completion`: Text completion job
- `embedding`: Embedding job
- `image-generation`: Image generation job
- `image-editing`: Image editing job
- `audio-transcription`: Audio transcription job
- `audio-translation`: Audio translation job

## Error Handling

If the job is not found, the API will return a `404 Not Found` response:

```json
{
  "error": {
    "message": "Job not found",
    "type": "not_found_error",
    "code": "job_not_found"
  }
}
```

If the job cannot be cancelled (e.g., it's already completed), the API will return a `400 Bad Request` response:

```json
{
  "error": {
    "message": "Job cannot be cancelled",
    "type": "invalid_request_error",
    "code": "job_cannot_be_cancelled"
  }
}
```

## Webhooks

You can receive notifications about job status changes by configuring webhooks in the [LocalBase Dashboard](https://app.localbase.io/settings/webhooks).

Webhook events for jobs include:

- `job.created`: A job was created
- `job.assigned`: A job was assigned to a provider
- `job.processing`: A job is being processed
- `job.completed`: A job was completed
- `job.failed`: A job failed
- `job.cancelled`: A job was cancelled

## Next Steps

Now that you understand how to work with jobs, you can explore other API endpoints:

- [Chat Completions](chat-completions.md)
- [Completions](completions.md)
- [Embeddings](embeddings.md)
- [Providers](providers.md)
- [Users](users.md)
