/**
 * LocalBase API Gateway
 * Database service
 */

const supabase = require("./supabase");
const { v4: uuidv4 } = require("uuid");
const {
	ResourceNotFoundError,
	ServiceUnavailableError,
} = require("../utils/errors");
const logger = require("../utils/logger");

/**
 * Database service
 * Handles data storage and retrieval using Supabase
 */
class DatabaseService {
	/**
	 * Find user by ID
	 *
	 * @param {string} userId - User ID
	 * @returns {Promise<Object|null>} - User object or null if not found
	 */
	async findUserById(userId) {
		try {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("id", userId)
				.single();

			if (error) {
				throw error;
			}

			return data;
		} catch (error) {
			logger.error(`Error finding user ${userId}:`, error);
			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Find user by API key
	 *
	 * @param {string} apiKey - API key
	 * @returns {Promise<Object|null>} - User object or null if not found
	 */
	async findUserByApiKey(apiKey) {
		try {
			// First, find the API key
			const { data: apiKeyData, error: apiKeyError } = await supabase
				.from("api_keys")
				.select("user_id, last_used")
				.eq("key", apiKey)
				.eq("active", true)
				.single();

			if (apiKeyError || !apiKeyData) {
				return null;
			}

			// Update last used timestamp
			await supabase
				.from("api_keys")
				.update({ last_used: new Date() })
				.eq("key", apiKey);

			// Get the user
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("*")
				.eq("id", apiKeyData.user_id)
				.single();

			if (userError) {
				throw userError;
			}

			return userData;
		} catch (error) {
			logger.error("Error finding user by API key:", error);
			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Create user
	 *
	 * @param {Object} userData - User data
	 * @returns {Promise<Object>} - Created user
	 */
	async createUser(userData) {
		try {
			const { data, error } = await supabase
				.from("users")
				.insert({
					name: userData.name,
					email: userData.email,
					active: userData.active !== false,
					tier: userData.tier || "basic",
					balance: userData.balance || 0,
				})
				.select()
				.single();

			if (error) {
				throw error;
			}

			return data;
		} catch (error) {
			logger.error("Error creating user:", error);
			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Create API key for user
	 *
	 * @param {string} userId - User ID
	 * @param {string} name - API key name
	 * @returns {Promise<string>} - API key
	 */
	async createApiKey(userId, name = "Default API Key") {
		try {
			// Check if user exists
			const user = await this.findUserById(userId);

			if (!user) {
				throw new ResourceNotFoundError("User", userId);
			}

			// Generate API key
			const key = `lb_sk_${uuidv4().replace(/-/g, "")}`;

			// Create API key in database
			const { error } = await supabase.from("api_keys").insert({
				key,
				user_id: userId,
				name,
			});

			if (error) {
				throw error;
			}

			return key;
		} catch (error) {
			logger.error(`Error creating API key for user ${userId}:`, error);

			if (error instanceof ResourceNotFoundError) {
				throw error;
			}

			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Update user balance
	 *
	 * @param {string} userId - User ID
	 * @param {number} newBalance - New balance
	 * @returns {Promise<Object>} - Updated user
	 */
	async updateUserBalance(userId, newBalance) {
		try {
			const { data, error } = await supabase
				.from("users")
				.update({ balance: newBalance })
				.eq("id", userId)
				.select()
				.single();

			if (error) {
				throw error;
			}

			if (!data) {
				throw new ResourceNotFoundError("User", userId);
			}

			return data;
		} catch (error) {
			logger.error(`Error updating balance for user ${userId}:`, error);

			if (error instanceof ResourceNotFoundError) {
				throw error;
			}

			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Record transaction
	 *
	 * @param {Object} transactionData - Transaction data
	 * @returns {Promise<Object>} - Recorded transaction
	 */
	async recordTransaction(transactionData) {
		try {
			const { data, error } = await supabase
				.from("transactions")
				.insert({
					user_id: transactionData.user,
					type: transactionData.type,
					amount: transactionData.amount,
					balance_after: transactionData.balance_after,
					status: transactionData.status || "completed",
					job_id: transactionData.job,
					provider_id: transactionData.provider_id,
					blockchain_tx: transactionData.blockchain_tx,
					metadata: transactionData.metadata,
				})
				.select()
				.single();

			if (error) {
				throw error;
			}

			return data;
		} catch (error) {
			logger.error("Error recording transaction:", error);
			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Get user transactions
	 *
	 * @param {string} userId - User ID
	 * @param {Object} filters - Filters
	 * @returns {Promise<Array>} - Array of transactions
	 */
	async getUserTransactions(userId, filters = {}) {
		try {
			let query = supabase
				.from("transactions")
				.select("*")
				.eq("user_id", userId);

			// Apply filters
			if (filters.type) {
				query = query.eq("type", filters.type);
			}

			if (filters.status) {
				query = query.eq("status", filters.status);
			}

			// Apply sorting
			query = query.order("created_at", { ascending: false });

			// Apply pagination
			const limit = filters.limit || 100;
			const offset = filters.offset || 0;
			query = query.range(offset, offset + limit - 1);

			const { data, error } = await query;

			if (error) {
				throw error;
			}

			return data;
		} catch (error) {
			logger.error(`Error getting transactions for user ${userId}:`, error);
			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Create job
	 *
	 * @param {Object} jobData - Job data
	 * @returns {Promise<Object>} - Created job
	 */
	async createJob(jobData) {
		try {
			const { data, error } = await supabase
				.from("jobs")
				.insert({
					user_id: jobData.user,
					model: jobData.model,
					provider_id: jobData.provider_id,
					input: jobData.input,
					parameters: jobData.parameters,
					blockchain_job_id: jobData.blockchain_job_id,
					status: "pending",
				})
				.select()
				.single();

			if (error) {
				throw error;
			}

			return data;
		} catch (error) {
			logger.error("Error creating job:", error);
			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Get job by ID
	 *
	 * @param {string} jobId - Job ID
	 * @returns {Promise<Object>} - Job object
	 */
	async getJob(jobId) {
		try {
			const { data, error } = await supabase
				.from("jobs")
				.select("*")
				.eq("id", jobId)
				.single();

			if (error) {
				throw error;
			}

			if (!data) {
				throw new ResourceNotFoundError("Job", jobId);
			}

			return data;
		} catch (error) {
			logger.error(`Error getting job ${jobId}:`, error);

			if (error instanceof ResourceNotFoundError) {
				throw error;
			}

			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Update job status
	 *
	 * @param {string} jobId - Job ID
	 * @param {string} status - New status
	 * @param {Object} data - Additional data
	 * @returns {Promise<Object>} - Updated job
	 */
	async updateJobStatus(jobId, status, data = {}) {
		try {
			const updateData = {
				status,
				updated_at: new Date(),
			};

			// Add status-specific timestamps
			if (status === "processing") {
				updateData.started_at = new Date();
			} else if (status === "completed") {
				updateData.completed_at = new Date();
				updateData.result = data.result;
				updateData.usage = data.usage;
				updateData.cost = data.cost;
			} else if (status === "failed") {
				updateData.failed_at = new Date();
				updateData.error = data.error;
			}

			// Add any additional data
			Object.assign(updateData, data);

			const { data: updatedJob, error } = await supabase
				.from("jobs")
				.update(updateData)
				.eq("id", jobId)
				.select()
				.single();

			if (error) {
				throw error;
			}

			if (!updatedJob) {
				throw new ResourceNotFoundError("Job", jobId);
			}

			return updatedJob;
		} catch (error) {
			logger.error(`Error updating job ${jobId} status:`, error);

			if (error instanceof ResourceNotFoundError) {
				throw error;
			}

			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Get user jobs
	 *
	 * @param {string} userId - User ID
	 * @param {Object} filters - Filters
	 * @returns {Promise<Array>} - Array of jobs
	 */
	async getUserJobs(userId, filters = {}) {
		try {
			let query = supabase.from("jobs").select("*").eq("user_id", userId);

			// Apply filters
			if (filters.status) {
				query = query.eq("status", filters.status);
			}

			if (filters.model) {
				query = query.eq("model", filters.model);
			}

			// Apply sorting
			query = query.order("created_at", { ascending: false });

			// Apply pagination
			const limit = filters.limit || 100;
			const offset = filters.offset || 0;
			query = query.range(offset, offset + limit - 1);

			const { data, error } = await query;

			if (error) {
				throw error;
			}

			return data;
		} catch (error) {
			logger.error(`Error getting jobs for user ${userId}:`, error);
			throw new ServiceUnavailableError("Database error");
		}
	}

	/**
	 * Initialize database with seed data
	 * Only used in development environment
	 */
	async initializeDevData() {
		try {
			// Check if we already have a test user
			const { data: existingUser, error: userError } = await supabase
				.from("users")
				.select("id")
				.eq("email", "test@example.com")
				.single();

			if (userError && userError.code !== "PGRST116") {
				// PGRST116 is "no rows returned"
				throw userError;
			}

			if (!existingUser) {
				logger.info("Initializing development data...");

				// Create test user
				const { data: user, error: createUserError } = await supabase
					.from("users")
					.insert({
						name: "Test User",
						email: "test@example.com",
						active: true,
						tier: "basic",
						balance: 100,
					})
					.select()
					.single();

				if (createUserError) {
					throw createUserError;
				}

				// Create test API key
				const { error: createApiKeyError } = await supabase
					.from("api_keys")
					.insert({
						key: "lb_sk_test123456789",
						user_id: user.id,
						name: "Test API Key",
					});

				if (createApiKeyError) {
					throw createApiKeyError;
				}

				logger.info("Development data initialized successfully");
			}
		} catch (error) {
			logger.error("Error initializing development data:", error);
		}
	}
}

// Export singleton instance
module.exports = new DatabaseService();
