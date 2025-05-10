/**
 * LocalBase API Gateway
 * Chat completions routes
 */

const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { InvalidRequestError } = require("../utils/errors");
const ResponseFormatter = require("../services/formatter");
const { estimateChatTokenCount } = require("../utils/tokenizer");
const providerSelector = require("../services/provider");
const jobManager = require("../services/job");

// Create response formatter
const responseFormatter = new ResponseFormatter();

/**
 * Mock chat completion implementation for development
 *
 * @param {Object} request - Chat completion request
 * @param {Object} provider - Selected provider
 * @returns {Promise<Object>} - Chat completion result
 */
function mockChatCompletion(request, provider) {
	return new Promise((resolve) => {
		setTimeout(() => {
			const lastMessage = request.messages[request.messages.length - 1];

			// Generate a simple response based on the last message
			let responseContent = "I am a helpful assistant.";

			if (
				lastMessage.content.toLowerCase().includes("hello") ||
				lastMessage.content.toLowerCase().includes("hi")
			) {
				responseContent = "Hello! How can I assist you today?";
			} else if (lastMessage.content.toLowerCase().includes("help")) {
				responseContent = "I'm here to help. What do you need assistance with?";
			} else if (lastMessage.content.includes("?")) {
				responseContent = "That's a good question. Let me think about it...";
			}

			// Calculate token usage
			const inputTokens = estimateChatTokenCount(request.messages);
			const outputTokens = Math.ceil(responseContent.length / 4);

			resolve({
				id: `chatcmpl-${Date.now()}`,
				model: request.model,
				provider_id: provider.id,
				created_at: Date.now(),
				output: responseContent,
				finish_reason: "stop",
				usage: {
					input_tokens: inputTokens,
					output_tokens: outputTokens,
				},
			});
		}, 500); // Simulate network delay
	});
}

/**
 * POST /v1/chat/completions
 * Create a chat completion
 */
router.post("/completions", authenticate, async (req, res, next) => {
	try {
		// Validate request
		if (!req.body.model) {
			throw new InvalidRequestError(
				"model is required",
				"model",
				"param_required"
			);
		}

		if (
			!req.body.messages ||
			!Array.isArray(req.body.messages) ||
			req.body.messages.length === 0
		) {
			throw new InvalidRequestError(
				"messages is required and must be an array",
				"messages",
				"param_required"
			);
		}

		// Validate each message has role and content
		for (const [index, message] of req.body.messages.entries()) {
			if (!message.role) {
				throw new InvalidRequestError(
					`messages[${index}].role is required`,
					"messages",
					"param_required"
				);
			}

			if (!message.content && message.role !== "system") {
				throw new InvalidRequestError(
					`messages[${index}].content is required`,
					"messages",
					"param_required"
				);
			}

			// Validate role is one of allowed values
			if (
				!["system", "user", "assistant", "function", "tool"].includes(
					message.role
				)
			) {
				throw new InvalidRequestError(
					`messages[${index}].role must be one of 'system', 'user', 'assistant', 'function', 'tool'`,
					"messages",
					"invalid_role"
				);
			}
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
			const responseContent = "Hello! How can I assist you today?";
			const chunks = responseContent.split(" ");
			const id = `chatcmpl-${Date.now()}`;

			// Create job in database
			await jobManager.createJob({
				user: req.user.id,
				model: req.body.model,
				provider_id: provider.id,
				input: { messages: req.body.messages },
				parameters: {
					...req.body,
					stream: true,
				},
			});

			// Send first chunk
			const firstChunk = responseFormatter.formatChatCompletionChunk(
				{
					id,
					model: req.body.model,
					created_at: Date.now(),
					content: "",
					is_first: true,
				},
				req.body
			);

			res.write(`data: ${JSON.stringify(firstChunk)}\n\n`);

			// Send content chunks
			let chunkIndex = 0;
			const sendChunk = () => {
				if (chunkIndex < chunks.length) {
					const chunk = responseFormatter.formatChatCompletionChunk(
						{
							id,
							model: req.body.model,
							created_at: Date.now(),
							content:
								chunks[chunkIndex] +
								(chunkIndex < chunks.length - 1 ? " " : ""),
							is_first: false,
						},
						req.body
					);

					res.write(`data: ${JSON.stringify(chunk)}\n\n`);
					chunkIndex++;
					setTimeout(sendChunk, 100);
				} else {
					// Send final chunk
					const finalChunk = responseFormatter.formatChatCompletionChunk(
						{
							id,
							model: req.body.model,
							created_at: Date.now(),
							content: "",
							finish_reason: "stop",
							is_first: false,
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
				input: { messages: req.body.messages },
				parameters: req.body,
			});

			// Non-streaming response
			// In production, route to provider
			// For now, use mock implementation
			const result = await mockChatCompletion(req.body, provider);

			// Update job with result
			await jobManager.completeJob(job.id, result.output, result.usage);

			// Format response
			const response = responseFormatter.formatChatCompletion(result, req.body);

			res.json(response);
		}
	} catch (error) {
		next(error);
	}
});

module.exports = router;
