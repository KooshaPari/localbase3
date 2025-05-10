/**
 * LocalBase API Gateway
 * Providers routes
 */

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { ResourceNotFoundError } = require('../utils/errors');

// Mock data for development
const mockProviders = [
  {
    id: 'provider_1',
    name: 'Provider 1',
    created: Math.floor(Date.now() / 1000) - 86400,
    hardware: {
      gpu_type: 'NVIDIA RTX 4090',
      vram: '24GB',
      cpu_cores: 16,
      ram: '64GB'
    },
    benchmark_results: {
      inference_speed: 120,
      max_batch_size: 8
    },
    reputation: 0.98,
    models_supported: ['lb-llama-3-70b', 'lb-mixtral-8x7b'],
    pricing: {
      'lb-llama-3-70b': {
        input_price_per_token: 0.00000002,
        output_price_per_token: 0.00000005
      },
      'lb-mixtral-8x7b': {
        input_price_per_token: 0.00000001,
        output_price_per_token: 0.00000003
      }
    },
    status: 'active',
    region: 'us-west',
    avg_response_time: 150,
    performance_history: {
      uptime_percentage: 99.8,
      avg_response_time: 150,
      completed_jobs: 15420
    }
  },
  {
    id: 'provider_2',
    name: 'Provider 2',
    created: Math.floor(Date.now() / 1000) - 86400,
    hardware: {
      gpu_type: 'NVIDIA RTX 3090',
      vram: '24GB',
      cpu_cores: 12,
      ram: '32GB'
    },
    benchmark_results: {
      inference_speed: 100,
      max_batch_size: 6
    },
    reputation: 0.95,
    models_supported: ['lb-llama-3-70b'],
    pricing: {
      'lb-llama-3-70b': {
        input_price_per_token: 0.00000001,
        output_price_per_token: 0.00000004
      }
    },
    status: 'active',
    region: 'eu-central',
    avg_response_time: 180,
    performance_history: {
      uptime_percentage: 99.5,
      avg_response_time: 180,
      completed_jobs: 8750
    }
  },
  {
    id: 'provider_3',
    name: 'Provider 3',
    created: Math.floor(Date.now() / 1000) - 86400,
    hardware: {
      gpu_type: 'NVIDIA A100',
      vram: '40GB',
      cpu_cores: 24,
      ram: '128GB'
    },
    benchmark_results: {
      inference_speed: 150,
      max_batch_size: 12
    },
    reputation: 0.97,
    models_supported: ['lb-embedding-ada-002'],
    pricing: {
      'lb-embedding-ada-002': {
        input_price_per_token: 0.00000001,
        output_price_per_token: 0.00000001
      }
    },
    status: 'active',
    region: 'us-east',
    avg_response_time: 80,
    performance_history: {
      uptime_percentage: 99.9,
      avg_response_time: 80,
      completed_jobs: 25680
    }
  }
];

/**
 * GET /v1/providers
 * List providers
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Apply filters
    let filteredProviders = [...mockProviders];
    
    // Filter by model
    if (req.query.model) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.models_supported.includes(req.query.model)
      );
    }
    
    // Filter by region
    if (req.query.region) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.region === req.query.region
      );
    }
    
    // Filter by minimum reputation
    if (req.query.min_reputation) {
      const minReputation = parseFloat(req.query.min_reputation);
      filteredProviders = filteredProviders.filter(provider => 
        provider.reputation >= minReputation
      );
    }
    
    // Format response
    const response = {
      object: 'list',
      data: filteredProviders
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
router.get('/:provider_id', authenticate, async (req, res, next) => {
  try {
    const providerId = req.params.provider_id;
    
    // Find provider
    const provider = mockProviders.find(p => p.id === providerId);
    
    if (!provider) {
      throw new ResourceNotFoundError('Provider', providerId, 'provider_not_found');
    }
    
    res.json(provider);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
