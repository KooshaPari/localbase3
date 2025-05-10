/**
 * LocalBase API Gateway
 * Server entry point
 */

// Load environment variables
require("dotenv").config();

const app = require("./src/app");
const config = require("./src/config");
const logger = require("./src/utils/logger");
const db = require("./src/services/db");

const PORT = config.port || 3000;

/**
 * Start the server
 */
async function startServer() {
	try {
		// Connect to MongoDB
		await db.connect();

		// Initialize development data if needed
		await db.initializeDevData();

		// Start the Express server
		app.listen(PORT, () => {
			logger.info(`LocalBase API Gateway listening on port ${PORT}`);
			logger.info(`Environment: ${config.environment}`);
		});
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
}

// Start the server
startServer();

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
	logger.error("Uncaught Exception:", error);
	// Perform graceful shutdown
	process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection at:", promise, "reason:", reason);
	// Application continues running
});
