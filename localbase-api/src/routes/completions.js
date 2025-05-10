/**
 * LocalBase API Gateway
 * Completions routes
 */

const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { InvalidRequestError } = require("../utils/errors");
const ResponseFormatter = require("../services/formatter");
const { estimateTokenCount } = require("../utils/tokenizer");
const providerSelector = require("../services/provider");
const jobManager = require("../services/job");

// Create response formatter
const responseFormatter = new ResponseFormatter();

/**
 * Mock completion implementation for development
 *
 * @param {Object} request - Completion request
 * @param {Object} provider - Selected provider
 * @returns {Promise<Object>} - Completion result
 */
function mockCompletion(request, provider) {
	return new Promise((resolve) => {
		setTimeout(() => {
			// Generate a simple response based on the prompt
			let responseText = "This is a sample completion response.";

			if (
				request.prompt.toLowerCase().includes("hello") ||
				request.prompt.toLowerCase().includes("hi")
			) {
				responseText =
					"Hello! This is a sample response from the LocalBase API.";
			} else if (request.prompt.toLowerCase().includes("help")) {
				responseText =
					"I can help you with various tasks. This is a sample response.";
			} else if (request.prompt.toLowerCase().startsWith("once upon a time")) {
				responseText = "in a land far away, there lived a brave knight who...";
			}

			// Calculate token usage
			const inputTokens = estimateTokenCount(request.prompt);
			const outputTokens = Math.ceil(responseText.length / 4);

			resolve({
				id: `cmpl-${Date.now()}`,
				model: request.model,
				provider_id: provider.id,
				created_at: Date.now(),
				output: responseText,
				finish_reason: "length",
				usage: {
					input_tokens: inputTokens,
					output_tokens: outputTokens,
				},
			});
		}, 500); // Simulate network delay
	});
}

/**
 * POST /v1/completions
 * Create a completion
 */
router.post("/", authenticate, async (req, res, next) => {
	try {
		// Validate request
		if (!req.body.model) {
			throw new InvalidRequestError(
				"model is required",
				"model",
				"param_required"
			);
		}

		if (req.body.prompt === undefined) {
			throw new InvalidRequestError(
				"prompt is required",
				"prompt",
				"param_required"
			);
		}

		// Handle array prompts
		let prompt = req.body.prompt;
		if (Array.isArray(prompt)) {
			// Use the first prompt for simplicity in this mock implementation
			// In production, handle batch processing properly
			prompt = prompt[0];
		}

		// Select provider
		const provider = await providerSelector.selectProvider({
			model: req.body.model,
			preferences: {
				min_reputation: req.body.min_reputation,
				max_price_per_token: req.body.max_price_per_token,
				region: req.body.region,
				provider_id: req.body.provider_id,
			},
			user: req.user,
		});

		// Handle streaming
		const stream = req.body.stream === true;

		if (stream) {
			// Set up SSE
			res.setHeader("Content-Type", "text/event-stream");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Connection", "keep-alive");

			// Mock streaming implementation
			let responseText = "This is a sample streaming completion response.";

			if (
				prompt.toLowerCase().includes("hello") ||
				prompt.toLowerCase().includes("hi")
			) {
				responseText =
					"Hello! This is a sample response from the LocalBase API.";
			} else if (prompt.toLowerCase().includes("help")) {
				responseText =
					"I can help you with various tasks. This is a sample response.";
			} else if (prompt.toLowerCase().startsWith("once upon a time")) {
				responseText = "in a land far away, there lived a brave knight who...";
			}

			const chunks = responseText.split(" ");
			const id = `cmpl-${Date.now()}`;

			// Create job in database
			await jobManager.createJob({
				user: req.user.id,
				model: req.body.model,
				provider_id: provider.id,
				input: { prompt },
				parameters: {
					...req.body,
					stream: true,
				},
			});

			// Send chunks
			let chunkIndex = 0;
			const sendChunk = () => {
				if (chunkIndex < chunks.length) {
					const chunk = responseFormatter.formatCompletionChunk(
						{
							id,
							model: req.body.model,
							created_at: Date.now(),
							content:
								chunks[chunkIndex] +
								(chunkIndex < chunks.length - 1 ? " " : ""),
						},
						req.body
					);

					res.write(`data: ${JSON.stringify(chunk)}\n\n`);
					chunkIndex++;
					setTimeout(sendChunk, 100);
				} else {
					// Send final chunk
					const finalChunk = responseFormatter.formatCompletionChunk(
						{
							id,
							model: req.body.model,
							created_at: Date.now(),
							content: "",
							finish_reason: "length",
						},
						req.body
					);

					res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
					res.write("data: [DONE]\n\n");
					res.end();
				}
			};

			// Start sending chunks
			setTimeout(sendChunk, 100);
		} else {
			// Create job in database
			const job = await jobManager.createJob({
				user: req.user.id,
				model: req.body.model,
				provider_id: provider.id,
				input: { prompt },
				parameters: req.body,
			});

			// Non-streaming response
			// In production, route to provider
			// For now, use mock implementation
			const result = await mockCompletion(
				{
					...req.body,
					prompt,
				},
				provider
			);

			// Update job with result
			await jobManager.completeJob(job.id, result.output, result.usage);

			// Format response
			const response = responseFormatter.formatCompletion(result, req.body);

			res.json(response);
		}
	} catch (error) {
		next(error);
	}
});

module.exports = router;
