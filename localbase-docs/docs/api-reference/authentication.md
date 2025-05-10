---
sidebar_position: 2
---

# Authentication

This page explains how to authenticate with the LocalBase API.

## API Keys

LocalBase uses API keys for authentication. You can create and manage API keys in the [LocalBase Dashboard](https://app.localbase.io/settings/api-keys).

### Creating an API Key

1. Sign in to the [LocalBase Dashboard](https://app.localbase.io)
2. Go to Settings > API Keys
3. Click "Create API Key"
4. Enter a name for the API key
5. Select the permissions for the API key
6. Click "Create"
7. Copy the API key (it will only be shown once)

### API Key Permissions

When creating an API key, you can specify the following permissions:

- **Read**: Can read data from the API
- **Write**: Can write data to the API
- **Billing**: Can access billing information
- **Admin**: Has full access to the API

### API Key Security

API keys are sensitive and should be kept secure:

- Do not share your API key with others
- Do not expose your API key in client-side code
- Rotate your API keys regularly
- Use environment variables to store your API key
- Set appropriate permissions for your API key

## Authentication Methods

LocalBase supports two authentication methods:

### Bearer Token

Include your API key in the `Authorization` header of your requests:

```
Authorization: Bearer your-api-key
```

Example:

```bash
curl https://api.localbase.io/v1/models \
  -H "Authorization: Bearer your-api-key"
```

### Query Parameter

You can also include your API key as a query parameter:

```
https://api.localbase.io/v1/models?api_key=your-api-key
```

Example:

```bash
curl https://api.localbase.io/v1/models?api_key=your-api-key
```

:::caution
Using query parameters for authentication is less secure than using headers, as API keys in URLs may be logged by servers and appear in browser history. Use this method only when necessary.
:::

## OpenAI Compatibility

LocalBase is compatible with the OpenAI API, so you can use your LocalBase API key with OpenAI client libraries:

### JavaScript/TypeScript

```javascript
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: 'your-api-key',
  basePath: 'https://api.localbase.io/v1',
});

const openai = new OpenAIApi(configuration);

const completion = await openai.createChatCompletion({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, world!' },
  ],
});

console.log(completion.data.choices[0].message.content);
```

### Python

```python
import openai

openai.api_key = "your-api-key"
openai.api_base = "https://api.localbase.io/v1"

completion = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, world!"},
    ],
)

print(completion.choices[0].message.content)
```

## Error Handling

If authentication fails, the API will return a `401 Unauthorized` response:

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "authentication_error",
    "code": "invalid_api_key"
  }
}
```

Common authentication errors:

- `invalid_api_key`: The API key is invalid
- `missing_api_key`: The API key is missing
- `expired_api_key`: The API key has expired
- `insufficient_permissions`: The API key does not have the required permissions

## Best Practices

- Use environment variables to store your API key
- Rotate your API keys regularly
- Use the minimum required permissions for your API key
- Do not expose your API key in client-side code
- Use a server-side proxy to make API calls if you need to call the API from a client-side application

## Next Steps

Now that you understand how to authenticate with the LocalBase API, you can explore the specific API endpoints:

- [Models](models.md)
- [Jobs](jobs.md)
- [Providers](providers.md)
- [Users](users.md)
- [Billing](billing.md)
- [SDK](sdk.md)
