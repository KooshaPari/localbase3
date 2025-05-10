/**
 * LocalBase API Gateway
 * Embeddings routes
 */

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { InvalidRequestError } = require('../utils/errors');
const ResponseFormatter = require('../services/formatter');
const { estimateTokenCount } = require('../utils/tokenizer');

// Create response formatter
const responseFormatter = new ResponseFormatter();

/**
 * Generate a mock embedding vector of specified dimension
 * 
 * @param {number} dimension - Dimension of the embedding vector
 * @returns {Array<number>} - Embedding vector
 */
function generateMockEmbedding(dimension = 1536) {
  const embedding = [];
  for (let i = 0; i < dimension; i++) {
    // Generate a random value between -1 and 1
    embedding.push((Math.random() * 2 - 1) * 0.1);
  }
  return embedding;
}

/**
 * Mock embedding implementation for development
 * 
 * @param {Object} request - Embedding request
 * @returns {Promise<Object>} - Embedding result
 */
function mockEmbedding(request) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Handle batch input
      const inputs = Array.isArray(request.input) ? request.input : [request.input];
      
      // Generate embeddings for each input
      const embeddings = inputs.map(() => generateMockEmbedding());
      
      // Calculate token usage
      const inputTokens = inputs.reduce((total, input) => {
        return total + estimateTokenCount(input);
      }, 0);
      
      // Return single embedding or batch
      if (inputs.length === 1) {
        resolve({
          model: request.model,
          provider_id: 'provider_3',
          created_at: Date.now(),
          embedding: embeddings[0],
          usage: {
            input_tokens: inputTokens
          }
        });
      } else {
        resolve({
          model: request.model,
          provider_id: 'provider_3',
          created_at: Date.now(),
          embeddings,
          usage: {
            input_tokens: inputTokens
          }
        });
      }
    }, 300); // Simulate network delay
  });
}

/**
 * POST /v1/embeddings
 * Create embeddings
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    // Validate request
    if (!req.body.model) {
      throw new InvalidRequestError('model is required', 'model', 'param_required');
    }
    
    if (req.body.input === undefined) {
      throw new InvalidRequestError('input is required', 'input', 'param_required');
    }
    
    // Validate input format
    if (!Array.isArray(req.body.input) && typeof req.body.input !== 'string') {
      throw new InvalidRequestError(
        'input must be a string or array of strings',
        'input',
        'invalid_input_format'
      );
    }
    
    if (Array.isArray(req.body.input)) {
      for (const [index, item] of req.body.input.entries()) {
        if (typeof item !== 'string') {
          throw new InvalidRequestError(
            `input[${index}] must be a string`,
            'input',
            'invalid_input_format'
          );
        }
      }
    }
    
    // In production, route to provider
    // For now, use mock implementation
    const result = await mockEmbedding(req.body);
    
    // Format response
    const response = responseFormatter.formatEmbedding(result, req.body);
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
