/**
 * LocalBase API Gateway
 * Providers routes
 */

const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { ResourceNotFoundError } = require("../utils/errors");
const blockchainClient = require("../services/blockchain");

/**
 * GET /v1/providers
 * List providers
 */
router.get("/", authenticate, async (req, res, next) => {
	try {
		let providers = [];

		// If model is specified, get providers for that model
		if (req.query.model) {
			providers = await blockchainClient.queryProvidersByModel(req.query.model);
		} else {
			// Get all providers for all supported models
			const models = await blockchainClient.queryModels();

			// Get providers for each model and merge them
			const providersMap = new Map();

			for (const model of models) {
				const modelProviders = await blockchainClient.queryProvidersByModel(
					model.id
				);

				for (const provider of modelProviders) {
					providersMap.set(provider.id, provider);
				}
			}

			providers = Array.from(providersMap.values());
		}

		// Apply additional filters

		// Filter by region
		if (req.query.region) {
			providers = providers.filter(
				(provider) => provider.region === req.query.region
			);
		}

		// Filter by minimum reputation
		if (req.query.min_reputation) {
			const minReputation = parseFloat(req.query.min_reputation);
			providers = providers.filter(
				(provider) => provider.reputation >= minReputation
			);
		}

		// Format response
		const response = {
			object: "list",
			data: providers,
		};

		res.json(response);
	} catch (error) {
		next(error);
	}
});

/**
 * GET /v1/providers/:provider_id
 * Get provider details
 */
router.get("/:provider_id", authenticate, async (req, res, next) => {
	try {
		const providerId = req.params.provider_id;

		// Get provider from blockchain
		const provider = await blockchainClient.queryProvider(providerId);

		res.json(provider);
	} catch (error) {
		next(error);
	}
});

module.exports = router;
