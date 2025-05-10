/**
 * LocalBase API Gateway
 * Models routes
 */

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { ResourceNotFoundError } = require('../utils/errors');
const ResponseFormatter = require('../services/formatter');

// Create response formatter
const responseFormatter = new ResponseFormatter();

// Mock data for development
const mockModels = [
  {
    id: 'lb-llama-3-70b',
    object: 'model',
    created_at: Date.now() - 86400000, // 1 day ago
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
    created_at: Date.now() - 86400000, // 1 day ago
    owned_by: 'localbase',
    providers: [
      {
        id: 'provider_1',
        reputation: 0.98,
        price_per_token: 0.00000003,
        avg_response_time: 120
      }
    ]
  },
  {
    id: 'lb-embedding-ada-002',
    object: 'model',
    created_at: Date.now() - 86400000, // 1 day ago
    owned_by: 'localbase',
    providers: [
      {
        id: 'provider_3',
        reputation: 0.97,
        price_per_token: 0.00000001,
        avg_response_time: 80
      }
    ]
  }
];

/**
 * GET /v1/models
 * List available models
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    // In production, fetch from blockchain or database
    // For now, use mock data
    
    const response = responseFormatter.formatModelsList(mockModels);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /v1/models/:model_id
 * Get model details
 */
router.get('/:model_id', authenticate, async (req, res, next) => {
  try {
    const modelId = req.params.model_id;
    
    // In production, fetch from blockchain or database
    // For now, use mock data
    const model = mockModels.find(m => m.id === modelId);
    
    if (!model) {
      throw new ResourceNotFoundError('Model', modelId, 'model_not_found');
    }
    
    const response = responseFormatter.formatModelDetails(model);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
