# LocalBase API Gateway

An OpenAI-compatible API gateway for the LocalBase decentralized AI compute marketplace.

## Overview

The LocalBase API Gateway provides an interface for users to access the decentralized AI compute resources available on the LocalBase network. It implements an OpenAI-compatible API, allowing users to easily switch from centralized providers to LocalBase's decentralized marketplace with minimal code changes.

## Features

- **OpenAI API Compatibility**: Drop-in replacement for OpenAI API clients
- **Provider Selection**: Intelligent routing to the most suitable providers
- **Decentralized Marketplace**: Access to a network of GPU providers
- **Cost Optimization**: Lower costs compared to centralized providers
- **Provider Preferences**: Specify requirements for provider selection

## API Endpoints

### Models

- `GET /v1/models`: List available models
- `GET /v1/models/:model_id`: Get model details

### Chat Completions

- `POST /v1/chat/completions`: Create a chat completion

### Completions

- `POST /v1/completions`: Create a completion

### Embeddings

- `POST /v1/embeddings`: Create embeddings

### Providers

- `GET /v1/providers`: List providers
- `GET /v1/providers/:provider_id`: Get provider details

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- MongoDB (optional for development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/localbase/api-gateway.git
   cd api-gateway
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Start the server:
   ```
   npm run dev
   ```

The API will be available at `http://localhost:3000`.

## Usage

### Authentication

Authentication is performed using API keys, similar to OpenAI's approach:

```
Authorization: Bearer lb_sk_xxxxxxxxxxxxxxxxxxxx
```

API keys can be generated and managed through the LocalBase dashboard.

### Example: Chat Completion

```javascript
const response = await fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer lb_sk_test123456789'
  },
  body: JSON.stringify({
    model: 'lb-llama-3-70b',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'Hello!'
      }
    ],
    temperature: 0.7,
    max_tokens: 150,
    provider_preferences: {
      min_reputation: 0.9,
      max_price_per_token: 0.0000001
    }
  })
});

const result = await response.json();
console.log(result.choices[0].message.content);
```

## Development

### Running Tests

```
npm test
```

### Linting

```
npm run lint
```

## License

MIT
