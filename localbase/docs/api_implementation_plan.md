# LocalBase API Gateway Implementation Plan

## Project Structure

```
localbase-api/
├── src/
│   ├── config/
│   │   ├── index.js         # Configuration management
│   │   └── default.js       # Default configuration values
│   ├── middleware/
│   │   ├── auth.js          # Authentication middleware
│   │   ├── rateLimit.js     # Rate limiting middleware
│   │   └── errorHandler.js  # Error handling middleware
│   ├── services/
│   │   ├── auth.js          # Authentication service
│   │   ├── provider.js      # Provider selection service
│   │   ├── job.js           # Job management service
│   │   ├── blockchain.js    # Blockchain client service
│   │   └── formatter.js     # Response formatter service
│   ├── routes/
│   │   ├── models.js        # Models endpoints
│   │   ├── chat.js          # Chat completions endpoints
│   │   ├── completions.js   # Completions endpoints
│   │   ├── embeddings.js    # Embeddings endpoints
│   │   └── providers.js     # Providers endpoints
│   ├── utils/
│   │   ├── errors.js        # Custom error classes
│   │   ├── logger.js        # Logging utility
│   │   └── tokenizer.js     # Token counting utility
│   └── app.js               # Express application setup
├── package.json             # Project dependencies
└── server.js                # Server entry point
```

## Implementation Phases

### Phase 1: Core API Structure

1. Set up Express application with middleware
2. Implement authentication service
3. Create basic route structure
4. Implement error handling

### Phase 2: OpenAI Compatibility Layer

1. Implement models endpoints
2. Create chat completions endpoint
3. Implement completions endpoint
4. Add embeddings endpoint

### Phase 3: Provider Integration

1. Implement provider selection service
2. Create job management service
3. Develop blockchain client integration
4. Add response formatting

### Phase 4: Testing and Optimization

1. Write unit and integration tests
2. Implement performance optimizations
3. Add monitoring and logging
4. Deploy and scale the API gateway

## Detailed Implementation Steps

### Phase 1: Core API Structure

#### Step 1.1: Project Setup

```bash
mkdir -p localbase-api/src/{config,middleware,services,routes,utils}
cd localbase-api
npm init -y
npm install express cors helmet body-parser dotenv jsonwebtoken mongoose
npm install --save-dev jest supertest nodemon
```

#### Step 1.2: Server Entry Point

Create `server.js`:

```javascript
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');

const PORT = config.port || 3000;

app.listen(PORT, () => {
  logger.info(`LocalBase API Gateway listening on port ${PORT}`);
});
```

#### Step 1.3: Express Application Setup

Create `src/app.js`:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const modelsRoutes = require('./routes/models');
const chatRoutes = require('./routes/chat');
const completionsRoutes = require('./routes/completions');
const embeddingsRoutes = require('./routes/embeddings');
const providersRoutes = require('./routes/providers');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/v1/models', modelsRoutes);
app.use('/v1/chat', chatRoutes);
app.use('/v1/completions', completionsRoutes);
app.use('/v1/embeddings', embeddingsRoutes);
app.use('/v1/providers', providersRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
```

#### Step 1.4: Configuration

Create `src/config/default.js`:

```javascript
module.exports = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/localbase',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Authentication configuration
  auth: {
    apiKeyPrefix: 'lb_sk_',
    jwtSecret: process.env.JWT_SECRET || 'localbase-secret',
    jwtExpiresIn: '30d'
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Blockchain configuration
  blockchain: {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:26657',
    chainId: process.env.BLOCKCHAIN_CHAIN_ID || 'localbase-1',
    walletMnemonic: process.env.BLOCKCHAIN_WALLET_MNEMONIC
  }
};
```

Create `src/config/index.js`:

```javascript
const defaultConfig = require('./default');

// Load environment-specific configuration
let envConfig = {};
try {
  envConfig = require(`./${process.env.NODE_ENV}`);
} catch (error) {
  // No environment-specific config found, use defaults
}

// Merge configurations
const config = {
  ...defaultConfig,
  ...envConfig
};

module.exports = config;
```

#### Step 1.5: Error Handling

Create `src/utils/errors.js`:

```javascript
class ApiError extends Error {
  constructor(statusCode, message, type = 'server_error', param = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', param = null, code = 'authentication_failed') {
    super(401, message, 'authentication_error', param, code);
  }
}

class InvalidRequestError extends ApiError {
  constructor(message, param = null, code = 'invalid_request') {
    super(400, message, 'invalid_request_error', param, code);
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded', param = null, code = 'rate_limit_exceeded') {
    super(429, message, 'rate_limit_error', param, code);
  }
}

class ResourceNotFoundError extends ApiError {
  constructor(resource, id, code = 'not_found') {
    super(404, `${resource} not found: ${id}`, 'invalid_request_error', resource.toLowerCase(), code);
  }
}

module.exports = {
  ApiError,
  AuthenticationError,
  InvalidRequestError,
  RateLimitError,
  ResourceNotFoundError
};
```

Create `src/middleware/errorHandler.js`:

```javascript
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('API Error:', err);
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        type: err.type,
        param: err.param,
        code: err.code
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

module.exports = errorHandler;
```

#### Step 1.6: Logging Utility

Create `src/utils/logger.js`:

```javascript
const config = require('../config');

// Simple logger implementation
// In production, replace with Winston or other logging library
const logger = {
  error: (...args) => {
    console.error(new Date().toISOString(), '[ERROR]', ...args);
  },
  warn: (...args) => {
    if (['debug', 'info', 'warn'].includes(config.logLevel)) {
      console.warn(new Date().toISOString(), '[WARN]', ...args);
    }
  },
  info: (...args) => {
    if (['debug', 'info'].includes(config.logLevel)) {
      console.info(new Date().toISOString(), '[INFO]', ...args);
    }
  },
  debug: (...args) => {
    if (config.logLevel === 'debug') {
      console.debug(new Date().toISOString(), '[DEBUG]', ...args);
    }
  }
};

module.exports = logger;
```

### Phase 2: OpenAI Compatibility Layer

#### Step 2.1: Authentication Service

Create `src/services/auth.js`:

```javascript
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthenticationError, RateLimitError } = require('../utils/errors');

// In-memory rate limiting (replace with Redis in production)
const rateLimits = new Map();

class AuthenticationService {
  constructor(db) {
    this.db = db;
  }

  async validateApiKey(apiKey) {
    // Validate API key format
    if (!apiKey || !apiKey.startsWith(config.auth.apiKeyPrefix)) {
      throw new AuthenticationError('Invalid API key format', 'api_key', 'invalid_api_key_format');
    }

    // In a real implementation, fetch from database
    // For now, use a mock implementation
    const user = await this._findUserByApiKey(apiKey);
    
    if (!user) {
      throw new AuthenticationError('Invalid API key', 'api_key', 'invalid_api_key');
    }

    // Check if user account is active
    if (!user.active) {
      throw new AuthenticationError('User account is inactive', 'api_key', 'inactive_account');
    }

    return user;
  }

  async checkRateLimit(userId, endpoint) {
    const key = `${userId}:${endpoint}`;
    const now = Date.now();
    const windowMs = config.rateLimit.windowMs;
    
    // Get current user's rate limit data
    let userRateLimit = rateLimits.get(key) || {
      count: 0,
      reset: now + windowMs
    };
    
    // Reset if window has expired
    if (now > userRateLimit.reset) {
      userRateLimit = {
        count: 0,
        reset: now + windowMs
      };
    }
    
    // Check if rate limit exceeded
    if (userRateLimit.count >= config.rateLimit.max) {
      throw new RateLimitError();
    }
    
    // Increment count and update map
    userRateLimit.count++;
    rateLimits.set(key, userRateLimit);
    
    // Return rate limit info for headers
    return {
      limit: config.rateLimit.max,
      remaining: config.rateLimit.max - userRateLimit.count,
      reset: Math.floor(userRateLimit.reset / 1000)
    };
  }

  // Mock implementation - replace with database query
  async _findUserByApiKey(apiKey) {
    // In production, fetch from database and verify hashed API key
    // For development, use a mock user
    if (apiKey === 'lb_sk_test123456789') {
      return {
        id: 'user_1',
        name: 'Test User',
        email: 'test@example.com',
        active: true,
        tier: 'basic'
      };
    }
    
    return null;
  }
}

module.exports = AuthenticationService;
```

#### Step 2.2: Authentication Middleware

Create `src/middleware/auth.js`:

```javascript
const AuthenticationService = require('../services/auth');
const logger = require('../utils/logger');

// Create authentication service instance
const authService = new AuthenticationService();

function authenticate(req, res, next) {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Missing or invalid Authorization header',
          type: 'authentication_error',
          code: 'invalid_auth_header'
        }
      });
    }
    
    const apiKey = authHeader.split(' ')[1];
    
    // Validate API key
    authService.validateApiKey(apiKey)
      .then(user => {
        // Attach user to request
        req.user = user;
        
        // Check rate limit
        return authService.checkRateLimit(user.id, req.path);
      })
      .then(rateLimitInfo => {
        // Set rate limit headers
        res.set('X-RateLimit-Limit', rateLimitInfo.limit);
        res.set('X-RateLimit-Remaining', rateLimitInfo.remaining);
        res.set('X-RateLimit-Reset', rateLimitInfo.reset);
        
        next();
      })
      .catch(error => {
        logger.error('Authentication error:', error);
        
        if (error.type === 'rate_limit_error') {
          return res.status(429).json({
            error: {
              message: error.message,
              type: error.type,
              code: error.code
            }
          });
        }
        
        res.status(401).json({
          error: {
            message: error.message,
            type: 'authentication_error',
            code: error.code || 'authentication_failed'
          }
        });
      });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    next(error);
  }
}

module.exports = authenticate;
```

#### Step 2.3: Models Routes

Create `src/routes/models.js`:

```javascript
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { ResourceNotFoundError } = require('../utils/errors');

// Mock data for development
const mockModels = [
  {
    id: 'lb-llama-3-70b',
    object: 'model',
    created: Math.floor(Date.now() / 1000) - 86400,
    owned_by: 'localbase',
    providers: [
      {
        id: 'provider_1',
        reputation: 0.98,
        price_per_token: 0.00000005,
        avg_response_time: 150
      },
      {
        id: 'provider_2',
        reputation: 0.95,
        price_per_token: 0.00000004,
        avg_response_time: 180
      }
    ]
  },
  {
    id: 'lb-mixtral-8x7b',
    object: 'model',
    created: Math.floor(Date.now() / 1000) - 86400,
    owned_by: 'localbase',
    providers: [
      {
        id: 'provider_1',
        reputation: 0.98,
        price_per_token: 0.00000003,
        avg_response_time: 120
      }
    ]
  }
];

// GET /v1/models
router.get('/', authenticate, async (req, res, next) => {
  try {
    // In production, fetch from blockchain or database
    // For now, use mock data
    
    const response = {
      object: 'list',
      data: mockModels
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /v1/models/:model_id
router.get('/:model_id', authenticate, async (req, res, next) => {
  try {
    const modelId = req.params.model_id;
    
    // In production, fetch from blockchain or database
    // For now, use mock data
    const model = mockModels.find(m => m.id === modelId);
    
    if (!model) {
      throw new ResourceNotFoundError('Model', modelId, 'model_not_found');
    }
    
    res.json(model);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

#### Step 2.4: Chat Completions Routes

Create `src/routes/chat.js`:

```javascript
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { InvalidRequestError } = require('../utils/errors');

// Mock implementation for development
function mockChatCompletion(request) {
  return new Promise(resolve => {
    setTimeout(() => {
      const lastMessage = request.messages[request.messages.length - 1];
      
      // Generate a simple response based on the last message
      let responseContent = 'I am a helpful assistant.';
      
      if (lastMessage.content.includes('hello') || lastMessage.content.includes('hi')) {
        responseContent = 'Hello! How can I assist you today?';
      } else if (lastMessage.content.includes('help')) {
        responseContent = 'I\'m here to help. What do you need assistance with?';
      } else if (lastMessage.content.includes('?')) {
        responseContent = 'That\'s a good question. Let me think about it...';
      }
      
      resolve({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        provider_id: 'provider_1',
        usage: {
          prompt_tokens: 20,
          completion_tokens: 30,
          total_tokens: 50
        },
        choices: [
          {
            message: {
              role: 'assistant',
              content: responseContent
            },
            finish_reason: 'stop',
            index: 0
          }
        ]
      });
    }, 500); // Simulate network delay
  });
}

// POST /v1/chat/completions
router.post('/completions', authenticate, async (req, res, next) => {
  try {
    // Validate request
    if (!req.body.model) {
      throw new InvalidRequestError('model is required', 'model', 'param_required');
    }
    
    if (!req.body.messages || !Array.isArray(req.body.messages) || req.body.messages.length === 0) {
      throw new InvalidRequestError('messages is required and must be an array', 'messages', 'param_required');
    }
    
    // In production, route to provider
    // For now, use mock implementation
    const response = await mockChatCompletion(req.body);
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

This implementation plan provides a solid foundation for building the OpenAI-compatible API gateway. In the next steps, we'll continue with the completions, embeddings, and provider integration components.
