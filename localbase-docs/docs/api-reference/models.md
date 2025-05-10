---
sidebar_position: 3
---

# Models

The Models API allows you to list and retrieve information about the models available on the LocalBase platform.

## List Models

```
GET /models
```

Retrieves a list of models available on the platform.

### Request

#### Headers

- `Authorization`: Your API key

#### Query Parameters

- `limit` (optional): The maximum number of models to return (default: 20, max: 100)
- `offset` (optional): The number of models to skip (default: 0)
- `provider` (optional): Filter models by provider ID
- `type` (optional): Filter models by type (e.g., "text", "image", "embedding")
- `sort` (optional): Sort models by a field (e.g., "created_at:desc")

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
      "provider_count": 10,
      "min_price": 0.0015,
      "max_price": 0.0025,
      "avg_price": 0.002,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "description": "More capable than any GPT-3.5 model, able to do more complex tasks, and optimized for chat.",
      "type": "text",
      "capabilities": ["chat", "completions"],
      "provider_count": 5,
      "min_price": 0.03,
      "max_price": 0.05,
      "avg_price": 0.04,
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
curl https://api.localbase.io/v1/models \
  -H "Authorization: Bearer your-api-key"
```

## Retrieve a Model

```
GET /models/{id}
```

Retrieves information about a specific model.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the model to retrieve

### Response

```json
{
  "id": "gpt-3.5-turbo",
  "name": "GPT-3.5 Turbo",
  "description": "Most capable GPT-3.5 model and optimized for chat at 1/10th the cost of text-davinci-003.",
  "type": "text",
  "capabilities": ["chat", "completions"],
  "provider_count": 10,
  "min_price": 0.0015,
  "max_price": 0.0025,
  "avg_price": 0.002,
  "parameters": {
    "temperature": {
      "type": "float",
      "default": 0.7,
      "min": 0.0,
      "max": 2.0,
      "description": "Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive."
    },
    "max_tokens": {
      "type": "integer",
      "default": 256,
      "min": 1,
      "max": 4096,
      "description": "The maximum number of tokens to generate in the completion."
    },
    "top_p": {
      "type": "float",
      "default": 1.0,
      "min": 0.0,
      "max": 1.0,
      "description": "Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered."
    },
    "frequency_penalty": {
      "type": "float",
      "default": 0.0,
      "min": -2.0,
      "max": 2.0,
      "description": "How much to penalize new tokens based on their existing frequency in the text so far. Decreases the model's likelihood to repeat the same line verbatim."
    },
    "presence_penalty": {
      "type": "float",
      "default": 0.0,
      "min": -2.0,
      "max": 2.0,
      "description": "How much to penalize new tokens based on whether they appear in the text so far. Increases the model's likelihood to talk about new topics."
    }
  },
  "providers": [
    {
      "id": "provider-1",
      "name": "Provider 1",
      "price": 0.0015,
      "reputation": 4.8,
      "uptime": 99.9
    },
    {
      "id": "provider-2",
      "name": "Provider 2",
      "price": 0.002,
      "reputation": 4.9,
      "uptime": 99.8
    }
  ],
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Example

```bash
curl https://api.localbase.io/v1/models/gpt-3.5-turbo \
  -H "Authorization: Bearer your-api-key"
```

## Model Types

LocalBase supports the following model types:

- `text`: Text generation models (e.g., GPT-3.5, GPT-4)
- `image`: Image generation models (e.g., DALL-E, Stable Diffusion)
- `embedding`: Embedding models (e.g., text-embedding-ada-002)
- `audio`: Audio processing models (e.g., Whisper)

## Model Capabilities

Models can have the following capabilities:

- `chat`: The model can be used for chat completions
- `completions`: The model can be used for text completions
- `embeddings`: The model can be used for embeddings
- `image-generation`: The model can be used for image generation
- `image-editing`: The model can be used for image editing
- `audio-transcription`: The model can be used for audio transcription
- `audio-translation`: The model can be used for audio translation

## Model Parameters

Models can have various parameters that control their behavior. Common parameters include:

- `temperature`: Controls randomness (higher values = more random)
- `max_tokens`: The maximum number of tokens to generate
- `top_p`: Controls diversity via nucleus sampling
- `frequency_penalty`: Penalizes repeated tokens
- `presence_penalty`: Penalizes repeated topics
- `stop`: Sequences where the model stops generating further tokens

## Error Handling

If the model is not found, the API will return a `404 Not Found` response:

```json
{
  "error": {
    "message": "Model not found",
    "type": "not_found_error",
    "code": "model_not_found"
  }
}
```

## Next Steps

Now that you understand how to work with models, you can explore other API endpoints:

- [Chat Completions](chat-completions.md)
- [Completions](completions.md)
- [Embeddings](embeddings.md)
- [Jobs](jobs.md)
- [Providers](providers.md)
