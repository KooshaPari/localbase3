/**
 * LocalBase API Gateway
 * Default configuration
 */

module.exports = {
	// Server configuration
	port: process.env.PORT || 3000,
	environment: process.env.NODE_ENV || "development",
	logLevel: process.env.LOG_LEVEL || "info",

	// Supabase configuration
	supabase: {
		url: process.env.SUPABASE_URL || "http://localhost:54321",
		serviceKey:
			process.env.SUPABASE_SERVICE_KEY ||
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU",
		anonKey:
			process.env.SUPABASE_ANON_KEY ||
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs",
	},

	// Authentication configuration
	auth: {
		apiKeyPrefix: "lb_sk_",
		jwtSecret: process.env.JWT_SECRET || "localbase-secret",
		jwtExpiresIn: "30d",
	},

	// Rate limiting configuration
	rateLimit: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100, // limit each IP to 100 requests per windowMs
		standardHeaders: true,
		legacyHeaders: false,
	},

	// Blockchain configuration
	blockchain: {
		rpcUrl: process.env.BLOCKCHAIN_RPC_URL || "http://localhost:26657",
		chainId: process.env.BLOCKCHAIN_CHAIN_ID || "localbase-1",
		walletMnemonic: process.env.BLOCKCHAIN_WALLET_MNEMONIC,
	},

	// Provider configuration
	provider: {
		defaultTimeout: 30000, // 30 seconds
		maxRetries: 3,
		retryDelay: 1000, // 1 second
	},

	// Model configuration
	models: {
		defaultCompletionModel: "lb-llama-3-70b",
		defaultEmbeddingModel: "lb-embedding-ada-002",
		supportedModels: [
			"lb-llama-3-70b",
			"lb-mixtral-8x7b",
			"lb-embedding-ada-002",
		],
	},
};
