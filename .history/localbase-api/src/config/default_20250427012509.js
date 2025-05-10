/**
 * LocalBase API Gateway
 * Default configuration
 */

module.exports = {
  // Server configuration
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
  },
  
  // Provider configuration
  provider: {
    defaultTimeout: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 1000 // 1 second
  },
  
  // Model configuration
  models: {
    defaultCompletionModel: 'lb-llama-3-70b',
    defaultEmbeddingModel: 'lb-embedding-ada-002',
    supportedModels: [
      'lb-llama-3-70b',
      'lb-mixtral-8x7b',
      'lb-embedding-ada-002'
    ]
  }
};
