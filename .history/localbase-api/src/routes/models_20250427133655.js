/**
 * LocalBase API Gateway
 * Models routes
 */

const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { ResourceNotFoundError } = require("../utils/errors");
const ResponseFormatter = require("../services/formatter");
const blockchainClient = require("../services/blockchain");

// Create response formatter
const responseFormatter = new ResponseFormatter();

/**
 * GET /v1/models
 * List available models
 */
router.get("/", authenticate, async (req, res, next) => {
	try {
		// Fetch models from blockchain
		const models = await blockchainClient.queryModels();

		const response = responseFormatter.formatModelsList(models);
		res.json(response);
	} catch (error) {
		next(error);
	}
});

/**
 * GET /v1/models/:model_id
 * Get model details
 */
router.get("/:model_id", authenticate, async (req, res, next) => {
	try {
		const modelId = req.params.model_id;

		// Fetch model from blockchain
		const model = await blockchainClient.queryModel(modelId);

		const response = responseFormatter.formatModelDetails(model);
		res.json(response);
	} catch (error) {
		next(error);
	}
});

module.exports = router;
