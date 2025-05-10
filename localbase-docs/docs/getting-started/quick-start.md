---
sidebar_position: 3
---

# Quick Start

This guide will help you get started with LocalBase quickly. We'll cover how to run your first AI job on the platform.

## Prerequisites

Before you begin, make sure you have:

- Installed the necessary components as described in the [Installation](installation.md) guide
- Created an account on the LocalBase platform
- Obtained an API key

## Running Your First Job

### Using the Web Interface

1. **Sign in to the LocalBase platform**:
   - Go to [https://app.localbase.io](https://app.localbase.io)
   - Sign in with your account

2. **Create a new job**:
   - Click on the "New Job" button
   - Select a model (e.g., "gpt-3.5-turbo")
   - Enter your prompt
   - Configure any additional parameters
   - Click "Run"

3. **View the results**:
   - The job will be processed by a provider on the network
   - Once complete, the results will be displayed
   - You can view the job details, including processing time and cost

### Using the API

You can also run jobs using the LocalBase API, which is compatible with the OpenAI API.

#### Authentication

```bash
# Set your API key
export LOCALBASE_API_KEY=your-api-key
```

#### Chat Completions

```bash
# Make a request to the chat completions endpoint
curl https://api.localbase.io/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOCALBASE_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, world!"}
    ],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

#### Completions

```bash
# Make a request to the completions endpoint
curl https://api.localbase.io/v1/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOCALBASE_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo-instruct",
    "prompt": "Hello, world!",
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

#### Embeddings

```bash
# Make a request to the embeddings endpoint
curl https://api.localbase.io/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOCALBASE_API_KEY" \
  -d '{
    "model": "text-embedding-ada-002",
    "input": "Hello, world!"
  }'
```

### Using the SDK

LocalBase provides SDKs for popular programming languages.

#### JavaScript/TypeScript

```bash
# Install the SDK
npm install localbase
```

```javascript
// Import the SDK
import { LocalBase } from 'localbase';

// Initialize the client
const localbase = new LocalBase({
  apiKey: 'your-api-key',
});

// Create a chat completion
async function createChatCompletion() {
  const completion = await localbase.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, world!' },
    ],
    temperature: 0.7,
    max_tokens: 100,
  });

  console.log(completion.choices[0].message.content);
}

createChatCompletion();
```

#### Python

```bash
# Install the SDK
pip install localbase
```

```python
# Import the SDK
from localbase import LocalBase

# Initialize the client
localbase = LocalBase(api_key="your-api-key")

# Create a chat completion
completion = localbase.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, world!"},
    ],
    temperature=0.7,
    max_tokens=100,
)

print(completion.choices[0].message.content)
```

## Monitoring Jobs

You can monitor your jobs through the web interface or the API.

### Web Interface

1. Go to [https://app.localbase.io/jobs](https://app.localbase.io/jobs)
2. View the list of your jobs
3. Click on a job to see its details

### API

```bash
# Get a list of jobs
curl https://api.localbase.io/v1/jobs \
  -H "Authorization: Bearer $LOCALBASE_API_KEY"

# Get a specific job
curl https://api.localbase.io/v1/jobs/{job_id} \
  -H "Authorization: Bearer $LOCALBASE_API_KEY"
```

## Managing API Keys

You can manage your API keys through the web interface.

1. Go to [https://app.localbase.io/settings/api-keys](https://app.localbase.io/settings/api-keys)
2. Create, view, or revoke API keys

## Next Steps

Now that you've run your first job on LocalBase, you can:

- Learn about the [Architecture](architecture.md) of LocalBase
- Explore the [API Reference](../api-reference/overview.md) for more details
- Check out the [Guides](../guides/overview.md) for specific use cases
