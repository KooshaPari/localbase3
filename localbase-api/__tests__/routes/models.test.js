const request = require('supertest');
const app = require('../../src/app');
const mockModels = require('../../src/mocks/models');

// Mock the authentication middleware
jest.mock('../../src/middleware/auth', () => {
  return (req, res, next) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      permissions: ['read:models'],
    };
    next();
  };
});

describe('Models Routes', () => {
  describe('GET /v1/models', () => {
    it('should return a list of models', async () => {
      const response = await request(app).get('/v1/models');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verify the models match our mock data
      expect(response.body.data).toEqual(mockModels);
    });
    
    it('should support filtering models by provider', async () => {
      const response = await request(app)
        .get('/v1/models')
        .query({ provider: 'openai' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verify all returned models are from the specified provider
      response.body.data.forEach(model => {
        expect(model.provider).toBe('openai');
      });
    });
    
    it('should support filtering models by capability', async () => {
      const response = await request(app)
        .get('/v1/models')
        .query({ capability: 'embeddings' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verify all returned models have the specified capability
      response.body.data.forEach(model => {
        expect(model.capabilities).toContain('embeddings');
      });
    });
  });
  
  describe('GET /v1/models/:model_id', () => {
    it('should return a specific model', async () => {
      const modelId = 'gpt-4';
      const response = await request(app).get(`/v1/models/${modelId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', modelId);
      expect(response.body).toHaveProperty('object', 'model');
      
      // Verify the model matches our mock data
      const expectedModel = mockModels.find(m => m.id === modelId);
      expect(response.body).toEqual(expectedModel);
    });
    
    it('should return 404 for non-existent model', async () => {
      const response = await request(app).get('/v1/models/non-existent-model');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('type', 'invalid_request_error');
      expect(response.body.error).toHaveProperty('code', 'model_not_found');
    });
  });
});
