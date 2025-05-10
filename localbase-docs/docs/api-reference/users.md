---
sidebar_position: 6
---

# Users

The Users API allows you to retrieve information about the current user and manage user settings.

## Retrieve Current User

```
GET /users/me
```

Retrieves information about the current user.

### Request

#### Headers

- `Authorization`: Your API key

### Response

```json
{
  "id": "user-123456",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "settings": {
    "default_model": "gpt-3.5-turbo",
    "default_provider": null,
    "default_parameters": {
      "temperature": 0.7,
      "max_tokens": 100
    },
    "notifications": {
      "email": true,
      "webhook": false
    }
  },
  "subscription": {
    "plan": "standard",
    "status": "active",
    "current_period_start": "2023-01-01T00:00:00Z",
    "current_period_end": "2023-02-01T00:00:00Z"
  },
  "balance": {
    "amount": 100.0,
    "currency": "USD"
  }
}
```

### Example

```bash
curl https://api.localbase.io/v1/users/me \
  -H "Authorization: Bearer your-api-key"
```

## Update Current User

```
PATCH /users/me
```

Updates information about the current user.

### Request

#### Headers

- `Authorization`: Your API key
- `Content-Type`: `application/json`

#### Body

```json
{
  "name": "John Smith",
  "settings": {
    "default_model": "gpt-4",
    "default_parameters": {
      "temperature": 0.5
    }
  }
}
```

#### Parameters

- `name` (optional): The user's name
- `settings` (optional): User settings
  - `default_model` (optional): Default model ID
  - `default_provider` (optional): Default provider ID
  - `default_parameters` (optional): Default model parameters
  - `notifications` (optional): Notification settings
    - `email` (optional): Whether to send email notifications
    - `webhook` (optional): Whether to send webhook notifications

### Response

```json
{
  "id": "user-123456",
  "email": "user@example.com",
  "name": "John Smith",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:01:00Z",
  "settings": {
    "default_model": "gpt-4",
    "default_provider": null,
    "default_parameters": {
      "temperature": 0.5,
      "max_tokens": 100
    },
    "notifications": {
      "email": true,
      "webhook": false
    }
  },
  "subscription": {
    "plan": "standard",
    "status": "active",
    "current_period_start": "2023-01-01T00:00:00Z",
    "current_period_end": "2023-02-01T00:00:00Z"
  },
  "balance": {
    "amount": 100.0,
    "currency": "USD"
  }
}
```

### Example

```bash
curl -X PATCH https://api.localbase.io/v1/users/me \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "settings": {
      "default_model": "gpt-4",
      "default_parameters": {
        "temperature": 0.5
      }
    }
  }'
```

## Retrieve User Usage

```
GET /users/me/usage
```

Retrieves usage information for the current user.

### Request

#### Headers

- `Authorization`: Your API key

#### Query Parameters

- `start_date` (optional): Start date for usage data (format: YYYY-MM-DD)
- `end_date` (optional): End date for usage data (format: YYYY-MM-DD)
- `model` (optional): Filter usage by model ID
- `provider_id` (optional): Filter usage by provider ID

### Response

```json
{
  "usage": {
    "total": {
      "jobs": 100,
      "tokens": 50000,
      "cost": {
        "amount": 10.0,
        "currency": "USD"
      }
    },
    "by_model": [
      {
        "model": "gpt-3.5-turbo",
        "jobs": 80,
        "tokens": 40000,
        "cost": {
          "amount": 6.0,
          "currency": "USD"
        }
      },
      {
        "model": "gpt-4",
        "jobs": 20,
        "tokens": 10000,
        "cost": {
          "amount": 4.0,
          "currency": "USD"
        }
      }
    ],
    "by_provider": [
      {
        "provider_id": "provider-1",
        "provider_name": "Provider 1",
        "jobs": 60,
        "tokens": 30000,
        "cost": {
          "amount": 5.0,
          "currency": "USD"
        }
      },
      {
        "provider_id": "provider-2",
        "provider_name": "Provider 2",
        "jobs": 40,
        "tokens": 20000,
        "cost": {
          "amount": 5.0,
          "currency": "USD"
        }
      }
    ],
    "by_day": [
      {
        "date": "2023-01-01",
        "jobs": 30,
        "tokens": 15000,
        "cost": {
          "amount": 3.0,
          "currency": "USD"
        }
      },
      {
        "date": "2023-01-02",
        "jobs": 40,
        "tokens": 20000,
        "cost": {
          "amount": 4.0,
          "currency": "USD"
        }
      },
      {
        "date": "2023-01-03",
        "jobs": 30,
        "tokens": 15000,
        "cost": {
          "amount": 3.0,
          "currency": "USD"
        }
      }
    ]
  },
  "period": {
    "start_date": "2023-01-01",
    "end_date": "2023-01-03"
  }
}
```

### Example

```bash
curl https://api.localbase.io/v1/users/me/usage?start_date=2023-01-01&end_date=2023-01-03 \
  -H "Authorization: Bearer your-api-key"
```

## List API Keys

```
GET /users/me/api-keys
```

Retrieves a list of API keys for the current user.

### Request

#### Headers

- `Authorization`: Your API key

### Response

```json
{
  "data": [
    {
      "id": "key-123456",
      "name": "Production API Key",
      "last_digits": "abcd",
      "created_at": "2023-01-01T00:00:00Z",
      "last_used_at": "2023-01-01T00:01:00Z",
      "permissions": ["read", "write"]
    },
    {
      "id": "key-123457",
      "name": "Development API Key",
      "last_digits": "efgh",
      "created_at": "2023-01-01T00:00:00Z",
      "last_used_at": null,
      "permissions": ["read"]
    }
  ]
}
```

### Example

```bash
curl https://api.localbase.io/v1/users/me/api-keys \
  -H "Authorization: Bearer your-api-key"
```

## Create API Key

```
POST /users/me/api-keys
```

Creates a new API key for the current user.

### Request

#### Headers

- `Authorization`: Your API key
- `Content-Type`: `application/json`

#### Body

```json
{
  "name": "New API Key",
  "permissions": ["read", "write"]
}
```

#### Parameters

- `name` (required): The name of the API key
- `permissions` (optional): The permissions for the API key (default: ["read", "write"])
  - `read`: Can read data from the API
  - `write`: Can write data to the API
  - `billing`: Can access billing information
  - `admin`: Has full access to the API

### Response

```json
{
  "id": "key-123458",
  "name": "New API Key",
  "key": "lb-sk-1234567890abcdef1234567890abcdef",
  "last_digits": "cdef",
  "created_at": "2023-01-01T00:02:00Z",
  "last_used_at": null,
  "permissions": ["read", "write"]
}
```

:::caution
The full API key is only returned once when it's created. Make sure to save it securely.
:::

### Example

```bash
curl -X POST https://api.localbase.io/v1/users/me/api-keys \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New API Key",
    "permissions": ["read", "write"]
  }'
```

## Delete API Key

```
DELETE /users/me/api-keys/{id}
```

Deletes an API key.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the API key to delete

### Response

```json
{
  "id": "key-123458",
  "deleted": true
}
```

### Example

```bash
curl -X DELETE https://api.localbase.io/v1/users/me/api-keys/key-123458 \
  -H "Authorization: Bearer your-api-key"
```

## User Settings

User settings include:

- `default_model`: The default model to use for jobs
- `default_provider`: The default provider to use for jobs
- `default_parameters`: Default parameters for models
- `notifications`: Notification settings
  - `email`: Whether to send email notifications
  - `webhook`: Whether to send webhook notifications

## Subscription Plans

LocalBase offers the following subscription plans:

- `free`: Free tier with limited usage
- `standard`: Standard tier with higher usage limits
- `professional`: Professional tier with even higher usage limits
- `enterprise`: Enterprise tier with custom usage limits

## Error Handling

If the API key doesn't have the required permissions, the API will return a `403 Forbidden` response:

```json
{
  "error": {
    "message": "Insufficient permissions",
    "type": "permission_error",
    "code": "insufficient_permissions"
  }
}
```

## Next Steps

Now that you understand how to work with users, you can explore other API endpoints:

- [Models](models.md)
- [Jobs](jobs.md)
- [Providers](providers.md)
- [Billing](billing.md)
