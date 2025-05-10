# LocalBase API Gateway Implementation Specification

## Overview

The LocalBase API Gateway provides an OpenAI-compatible interface for accessing the decentralized AI compute marketplace. This document outlines the implementation details, architecture, and components of the API Gateway.

## Design Principles

1. **OpenAI Compatibility**: Maintain full compatibility with OpenAI's API to enable seamless integration with existing tools and libraries.
2. **Decentralization**: Route requests to the appropriate providers in the LocalBase network.
3. **Performance**: Optimize for low latency and high throughput.
4. **Security**: Implement robust authentication, authorization, and encryption.
5. **Scalability**: Design for horizontal scaling to handle growing demand.

## Core Components

### 1. Authentication Service

Handles API key management and request authentication.

**Responsibilities:**
- Validate API keys
- Manage user authentication
- Handle rate limiting
- Process permissions and access control

**Implementation:**
```javascript
class AuthenticationService {
  constructor(db, config) {
    this.db = db;
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimits);
  }

  async validateApiKey(apiKey) {
    // Validate API key format
    if (!apiKey || !apiKey.startsWith('lb_sk_')) {
      return { valid: false, error: 'Invalid API key format' };
    }

    // Check API key in database
    const user = await this.db.users.findByApiKey(apiKey);
    if (!user) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check if user account is active
    if (!user.active) {
      return { valid: false, error: 'User account is inactive' };
    }

    return { valid: true, user };
  }

  async checkRateLimit(userId, endpoint) {
    return this.rateLimiter.check(userId, endpoint);
  }
}
```

### 2. Request Router

Routes API requests to the appropriate providers based on model requirements and user preferences.

**Responsibilities:**
- Parse and validate incoming requests
- Select appropriate providers based on requirements
- Handle provider failover and load balancing
- Monitor request status and timeouts

**Implementation:**
```javascript
class RequestRouter {
  constructor(providerSelector, jobManager, config) {
    this.providerSelector = providerSelector;
    this.jobManager = jobManager;
    this.config = config;
  }

  async routeRequest(request, user) {
    // Validate request format
    const validationResult = this.validateRequest(request);
    if (!validationResult.valid) {
      throw new ApiError(400, validationResult.error);
    }

    // Select provider based on model and preferences
    const provider = await this.providerSelector.selectProvider({
      model: request.model,
      preferences: request.provider_preferences || {},
      user
    });

    // Create job
    const job = await this.jobManager.createJob({
      user: user.id,
      model: request.model,
      input: this.formatJobInput(request),
      provider: provider.id,
      parameters: this.extractParameters(request)
    });

    // Submit job to provider
    const result = await this.submitJobToProvider(job, provider);
    
    // Format response according to OpenAI API format
    return this.formatResponse(result, request);
  }
}
```

### 3. Provider Selector

Selects the most appropriate provider for a given request based on various criteria.

**Responsibilities:**
- Query available providers from the blockchain
- Filter providers based on model support
- Rank providers based on reputation, cost, and performance
- Handle provider preferences specified by the user

**Implementation:**
```javascript
class ProviderSelector {
  constructor(blockchainClient, db, config) {
    this.blockchainClient = blockchainClient;
    this.db = db;
    this.config = config;
  }

  async selectProvider(options) {
    const { model, preferences, user } = options;
    
    // Get providers supporting the requested model
    const providers = await this.blockchainClient.queryProvidersByModel(model);
    
    if (providers.length === 0) {
      throw new ApiError(404, `No providers available for model: ${model}`);
    }
    
    // Filter providers based on user preferences
    const filteredProviders = this.filterProviders(providers, preferences);
    
    if (filteredProviders.length === 0) {
      throw new ApiError(400, 'No providers match the specified preferences');
    }
    
    // Rank providers based on multiple factors
    const rankedProviders = this.rankProviders(filteredProviders, preferences);
    
    // Return the highest-ranked provider
    return rankedProviders[0];
  }
  
  filterProviders(providers, preferences) {
    return providers.filter(provider => {
      // Filter by minimum reputation
      if (preferences.min_reputation && 
          provider.reputation < preferences.min_reputation) {
        return false;
      }
      
      // Filter by maximum price
      if (preferences.max_price_per_token && 
          provider.pricing.output_price_per_token > preferences.max_price_per_token) {
        return false;
      }
      
      // Filter by region
      if (preferences.region && 
          provider.region !== preferences.region) {
        return false;
      }
      
      // Filter by response time
      if (preferences.max_response_time_ms && 
          provider.avg_response_time > preferences.max_response_time_ms) {
        return false;
      }
      
      return true;
    });
  }
  
  rankProviders(providers, preferences) {
    // Calculate score for each provider based on multiple factors
    const scoredProviders = providers.map(provider => {
      let score = 0;
      
      // Base score from reputation (0-100)
      score += provider.reputation * 100;
      
      // Price factor (lower price = higher score)
      const priceFactor = 1 - (provider.pricing.output_price_per_token / 0.0001);
      score += priceFactor * 50;
      
      // Performance factor (lower response time = higher score)
      const performanceFactor = 1 - (provider.avg_response_time / 1000);
      score += performanceFactor * 30;
      
      // Preferred provider bonus
      if (preferences.preferred_provider_id === provider.id) {
        score += 100;
      }
      
      return { provider, score };
    });
    
    // Sort by score (descending)
    scoredProviders.sort((a, b) => b.score - a.score);
    
    // Return providers only
    return scoredProviders.map(item => item.provider);
  }
}
```

### 4. Job Manager

Manages the lifecycle of inference jobs from creation to completion.

**Responsibilities:**
- Create and track jobs
- Monitor job status
- Handle job timeouts and retries
- Store job results

**Implementation:**
```javascript
class JobManager {
  constructor(db, blockchainClient, config) {
    this.db = db;
    this.blockchainClient = blockchainClient;
    this.config = config;
  }

  async createJob(jobData) {
    // Generate unique job ID
    const jobId = `job_${uuidv4()}`;
    
    // Create job record
    const job = {
      id: jobId,
      user_id: jobData.user,
      model: jobData.model,
      provider_id: jobData.provider,
      input: jobData.input,
      parameters: jobData.parameters,
      status: 'pending',
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    // Store job in database
    await this.db.jobs.create(job);
    
    // Create job on blockchain
    await this.blockchainClient.createJob({
      id: jobId,
      model: jobData.model,
      provider: jobData.provider,
      parameters: {
        max_tokens: jobData.parameters.max_tokens,
        temperature: jobData.parameters.temperature
      }
    });
    
    return job;
  }
  
  async getJob(jobId) {
    // Get job from database
    const job = await this.db.jobs.findById(jobId);
    
    if (!job) {
      throw new ApiError(404, `Job not found: ${jobId}`);
    }
    
    // If job is pending or processing, check blockchain for updates
    if (job.status === 'pending' || job.status === 'processing') {
      const blockchainJob = await this.blockchainClient.queryJob(jobId);
      
      // Update job status if changed
      if (blockchainJob.status !== job.status) {
        job.status = blockchainJob.status;
        job.updated_at = Date.now();
        
        if (blockchainJob.status === 'completed') {
          job.result = blockchainJob.result;
          job.completed_at = Date.now();
        } else if (blockchainJob.status === 'failed') {
          job.error = blockchainJob.error;
          job.failed_at = Date.now();
        }
        
        await this.db.jobs.update(job);
      }
    }
    
    return job;
  }
  
  async listJobs(userId, filters = {}) {
    // Query jobs from database
    const query = { user_id: userId };
    
    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.model) {
      query.model = filters.model;
    }
    
    if (filters.provider_id) {
      query.provider_id = filters.provider_id;
    }
    
    // Get jobs from database
    const jobs = await this.db.jobs.find(query, {
      limit: filters.limit || 100,
      offset: filters.offset || 0,
      sort: { created_at: -1 }
    });
    
    return jobs;
  }
}
```

### 5. Blockchain Client

Interfaces with the LocalBase blockchain for provider discovery, job management, and payment processing.

**Responsibilities:**
- Query providers from the blockchain
- Create and monitor jobs on the blockchain
- Handle payment escrow and settlement
- Update provider reputation

**Implementation:**
```javascript
class BlockchainClient {
  constructor(config) {
    this.config = config;
    this.client = new CosmosClient(config.rpcUrl);
    this.wallet = new Wallet(config.walletMnemonic);
  }

  async queryProvidersByModel(model) {
    const response = await this.client.query('provider', 'list_providers_by_model', {
      model,
      status: 'active'
    });
    
    return response.providers;
  }
  
  async queryProvider(providerId) {
    const response = await this.client.query('provider', 'get_provider', {
      provider_id: providerId
    });
    
    return response.provider;
  }
  
  async createJob(jobData) {
    const msg = {
      type: 'create_job',
      value: {
        job_id: jobData.id,
        model: jobData.model,
        provider_id: jobData.provider,
        parameters: jobData.parameters
      }
    };
    
    const tx = await this.client.signAndBroadcast([msg], {
      gas: 200000,
      fee: {
        amount: [{ denom: 'ulb', amount: '5000' }],
        gas: '200000'
      }
    });
    
    return tx;
  }
  
  async queryJob(jobId) {
    const response = await this.client.query('job', 'get_job', {
      job_id: jobId
    });
    
    return response.job;
  }
  
  async createEscrow(escrowData) {
    const msg = {
      type: 'create_escrow',
      value: {
        job_id: escrowData.jobId,
        user_id: escrowData.userId,
        provider_id: escrowData.providerId,
        amount: escrowData.amount
      }
    };
    
    const tx = await this.client.signAndBroadcast([msg], {
      gas: 200000,
      fee: {
        amount: [{ denom: 'ulb', amount: '5000' }],
        gas: '200000'
      }
    });
    
    return tx;
  }
}
```

### 6. Payment Processor

Handles payment processing between users and providers.

**Responsibilities:**
- Calculate job costs
- Create payment escrows
- Process payments and refunds
- Track payment history

**Implementation:**
```javascript
class PaymentProcessor {
  constructor(blockchainClient, db, config) {
    this.blockchainClient = blockchainClient;
    this.db = db;
    this.config = config;
  }

  async calculateJobCost(jobData, provider) {
    // Estimate input tokens
    const inputTokens = this.estimateTokenCount(jobData.input);
    
    // Estimate maximum output tokens
    const outputTokens = jobData.parameters.max_tokens || 100;
    
    // Calculate cost based on provider pricing
    const inputCost = inputTokens * provider.pricing.input_price_per_token;
    const outputCost = outputTokens * provider.pricing.output_price_per_token;
    
    // Add safety margin
    const totalCost = (inputCost + outputCost) * 1.1;
    
    return {
      estimated_input_tokens: inputTokens,
      estimated_output_tokens: outputTokens,
      input_cost: inputCost,
      output_cost: outputCost,
      total_cost: totalCost
    };
  }
  
  async createEscrow(userId, jobId, providerId, amount) {
    // Check user balance
    const user = await this.db.users.findById(userId);
    
    if (user.balance < amount) {
      throw new ApiError(402, 'Insufficient funds');
    }
    
    // Create escrow on blockchain
    const escrow = await this.blockchainClient.createEscrow({
      jobId,
      userId,
      providerId,
      amount
    });
    
    // Update user balance
    await this.db.users.updateBalance(userId, user.balance - amount);
    
    // Record transaction
    await this.db.transactions.create({
      user_id: userId,
      type: 'escrow',
      amount: -amount,
      job_id: jobId,
      provider_id: providerId,
      timestamp: Date.now()
    });
    
    return escrow;
  }
  
  async releasePayment(jobId) {
    // Get job details
    const job = await this.db.jobs.findById(jobId);
    
    if (!job) {
      throw new ApiError(404, `Job not found: ${jobId}`);
    }
    
    // Get escrow details
    const escrow = await this.blockchainClient.queryEscrow(jobId);
    
    // Release escrow on blockchain
    await this.blockchainClient.releaseEscrow(jobId);
    
    // Record transaction for provider
    await this.db.transactions.create({
      user_id: job.provider_id,
      type: 'payment',
      amount: escrow.amount,
      job_id: jobId,
      timestamp: Date.now()
    });
    
    return { success: true };
  }
}
```

### 7. Response Formatter

Formats API responses to match the OpenAI API format.

**Responsibilities:**
- Transform internal response format to OpenAI format
- Handle different response types (completions, chat, embeddings)
- Include usage information and metadata

**Implementation:**
```javascript
class ResponseFormatter {
  formatChatCompletion(result, request) {
    return {
      id: result.id,
      object: 'chat.completion',
      created: Math.floor(result.created_at / 1000),
      model: result.model,
      provider_id: result.provider_id,
      usage: {
        prompt_tokens: result.usage.input_tokens,
        completion_tokens: result.usage.output_tokens,
        total_tokens: result.usage.input_tokens + result.usage.output_tokens
      },
      choices: [
        {
          message: {
            role: 'assistant',
            content: result.output
          },
          finish_reason: result.finish_reason,
          index: 0
        }
      ]
    };
  }
  
  formatCompletion(result, request) {
    return {
      id: result.id,
      object: 'text_completion',
      created: Math.floor(result.created_at / 1000),
      model: result.model,
      provider_id: result.provider_id,
      choices: [
        {
          text: result.output,
          index: 0,
          finish_reason: result.finish_reason
        }
      ],
      usage: {
        prompt_tokens: result.usage.input_tokens,
        completion_tokens: result.usage.output_tokens,
        total_tokens: result.usage.input_tokens + result.usage.output_tokens
      }
    };
  }
  
  formatEmbedding(result, request) {
    return {
      object: 'list',
      data: [
        {
          object: 'embedding',
          embedding: result.embedding,
          index: 0
        }
      ],
      model: result.model,
      provider_id: result.provider_id,
      usage: {
        prompt_tokens: result.usage.input_tokens,
        total_tokens: result.usage.input_tokens
      }
    };
  }
}
```

## API Endpoints Implementation

### 1. Models Endpoints

```javascript
// GET /models
async function listModels(req, res) {
  try {
    const models = await blockchainClient.queryModels();
    
    const response = {
      object: 'list',
      data: models.map(model => ({
        id: model.id,
        object: 'model',
        created: Math.floor(model.created_at / 1000),
        owned_by: 'localbase',
        providers: model.providers
      }))
    };
    
    res.json(response);
  } catch (error) {
    handleError(res, error);
  }
}

// GET /models/:model_id
async function getModel(req, res) {
  try {
    const modelId = req.params.model_id;
    const model = await blockchainClient.queryModel(modelId);
    
    if (!model) {
      return res.status(404).json({
        error: {
          message: `Model not found: ${modelId}`,
          type: 'invalid_request_error',
          param: 'model',
          code: 'model_not_found'
        }
      });
    }
    
    const response = {
      id: model.id,
      object: 'model',
      created: Math.floor(model.created_at / 1000),
      owned_by: 'localbase',
      providers: model.providers
    };
    
    res.json(response);
  } catch (error) {
    handleError(res, error);
  }
}
```

### 2. Chat Completions Endpoint

```javascript
// POST /chat/completions
async function createChatCompletion(req, res) {
  try {
    // Authenticate user
    const apiKey = req.headers.authorization?.split(' ')[1];
    const authResult = await authService.validateApiKey(apiKey);
    
    if (!authResult.valid) {
      return res.status(401).json({
        error: {
          message: authResult.error,
          type: 'authentication_error',
          code: 'invalid_api_key'
        }
      });
    }
    
    // Check rate limit
    const rateLimitResult = await authService.checkRateLimit(
      authResult.user.id, 
      'chat_completions'
    );
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded'
        }
      });
    }
    
    // Validate request
    if (!req.body.model) {
      return res.status(400).json({
        error: {
          message: 'model is required',
          type: 'invalid_request_error',
          param: 'model',
          code: 'param_required'
        }
      });
    }
    
    if (!req.body.messages || !Array.isArray(req.body.messages) || req.body.messages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'messages is required and must be an array',
          type: 'invalid_request_error',
          param: 'messages',
          code: 'param_required'
        }
      });
    }
    
    // Route request to provider
    const result = await requestRouter.routeRequest(req.body, authResult.user);
    
    // Format response
    const response = responseFormatter.formatChatCompletion(result, req.body);
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', rateLimitResult.limit);
    res.set('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.set('X-RateLimit-Reset', rateLimitResult.reset);
    
    res.json(response);
  } catch (error) {
    handleError(res, error);
  }
}
```

## Error Handling

```javascript
function handleError(res, error) {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        type: error.type,
        param: error.param,
        code: error.code
      }
    });
  }
  
  // Default error response
  res.status(500).json({
    error: {
      message: 'An unexpected error occurred',
      type: 'server_error',
      code: 'internal_server_error'
    }
  });
}

class ApiError extends Error {
  constructor(statusCode, message, type = 'server_error', param = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.param = param;
    this.code = code;
  }
}
```

## API Server Setup

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

function setupApiServer(config) {
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(bodyParser.json());
  
  // Basic rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  }));
  
  // Routes
  app.get('/v1/models', listModels);
  app.get('/v1/models/:model_id', getModel);
  app.post('/v1/chat/completions', createChatCompletion);
  app.post('/v1/completions', createCompletion);
  app.post('/v1/embeddings', createEmbedding);
  app.get('/v1/providers', listProviders);
  app.get('/v1/providers/:provider_id', getProvider);
  app.get('/v1/jobs', listJobs);
  app.get('/v1/jobs/:job_id', getJob);
  
  // Error handling
  app.use((err, req, res, next) => {
    handleError(res, err);
  });
  
  return app;
}
```

## Deployment Architecture

The API Gateway is designed to be deployed as a horizontally scalable service:

1. **Load Balancer**: Distributes incoming requests across multiple API Gateway instances
2. **API Gateway Instances**: Stateless servers that process API requests
3. **Database**: Stores user data, API keys, and job information
4. **Blockchain Client**: Connects to the LocalBase blockchain
5. **Caching Layer**: Caches frequently accessed data like provider information

## Security Considerations

1. **API Key Security**:
   - Store API keys as hashed values
   - Implement key rotation policies
   - Use secure transmission (HTTPS)

2. **Request Validation**:
   - Validate all input parameters
   - Implement input sanitization
   - Set appropriate size limits

3. **Rate Limiting**:
   - Implement per-user and per-IP rate limits
   - Use token bucket algorithm for fair limiting
   - Provide clear rate limit headers

4. **Monitoring and Logging**:
   - Log all API requests (excluding sensitive data)
   - Monitor for suspicious patterns
   - Implement alerting for security events

## Performance Optimization

1. **Caching**:
   - Cache provider information
   - Cache model metadata
   - Implement result caching for identical requests

2. **Connection Pooling**:
   - Use connection pools for database access
   - Maintain persistent connections to blockchain nodes
   - Implement connection reuse for provider communication

3. **Asynchronous Processing**:
   - Use non-blocking I/O for all operations
   - Implement job queues for high-load scenarios
   - Use worker processes for CPU-intensive tasks

## Testing Strategy

1. **Unit Testing**:
   - Test individual components in isolation
   - Mock external dependencies
   - Achieve high code coverage

2. **Integration Testing**:
   - Test component interactions
   - Use test doubles for external services
   - Verify correct data flow

3. **Load Testing**:
   - Simulate high request volumes
   - Measure response times under load
   - Identify bottlenecks

4. **Security Testing**:
   - Perform penetration testing
   - Test for common vulnerabilities
   - Verify rate limiting effectiveness

## Conclusion

The LocalBase API Gateway provides an OpenAI-compatible interface to the decentralized AI compute marketplace. By following this implementation specification, developers can create a robust, secure, and scalable API Gateway that connects users to the LocalBase network while maintaining compatibility with existing tools and libraries.
