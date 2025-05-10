const request = require('supertest');
const app = require('../src/app');

describe('API Gateway', () => {
  describe('Health Check', () => {
    it('should return 200 OK for health check endpoint', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
  
  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('type', 'invalid_request_error');
      expect(response.body.error).toHaveProperty('code', 'route_not_found');
    });
  });
  
  describe('Models Endpoints', () => {
    it('should return a list of models', async () => {
      const response = await request(app)
        .get('/v1/models')
        .set('Authorization', 'Bearer test-api-key');
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should return a specific model', async () => {
      const response = await request(app)
        .get('/v1/models/gpt-4')
        .set('Authorization', 'Bearer test-api-key');
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'gpt-4');
      expect(response.body).toHaveProperty('object', 'model');
    });
    
    it('should return 404 for non-existent model', async () => {
      const response = await request(app)
        .get('/v1/models/non-existent-model')
        .set('Authorization', 'Bearer test-api-key');
        
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'invalid_request_error');
      expect(response.body.error).toHaveProperty('code', 'model_not_found');
    });
  });
  
  describe('Chat Completions Endpoint', () => {
    it('should create a chat completion', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello, how are you?' }
          ],
          max_tokens: 100
        });
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('object', 'chat.completion');
      expect(response.body).toHaveProperty('choices');
      expect(Array.isArray(response.body.choices)).toBe(true);
      expect(response.body.choices[0]).toHaveProperty('message');
      expect(response.body.choices[0].message).toHaveProperty('role', 'assistant');
      expect(response.body.choices[0].message).toHaveProperty('content');
    });
    
    it('should return 400 for invalid request', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          // Missing required fields
        });
        
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'invalid_request_error');
    });
  });
  
  describe('Completions Endpoint', () => {
    it('should create a completion', async () => {
      const response = await request(app)
        .post('/v1/completions')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          model: 'gpt-4',
          prompt: 'Once upon a time',
          max_tokens: 100
        });
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('object', 'text_completion');
      expect(response.body).toHaveProperty('choices');
      expect(Array.isArray(response.body.choices)).toBe(true);
      expect(response.body.choices[0]).toHaveProperty('text');
    });
    
    it('should return 400 for invalid request', async () => {
      const response = await request(app)
        .post('/v1/completions')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          // Missing required fields
        });
        
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'invalid_request_error');
    });
  });
  
  describe('Embeddings Endpoint', () => {
    it('should create embeddings', async () => {
      const response = await request(app)
        .post('/v1/embeddings')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          model: 'text-embedding-ada-002',
          input: 'The food was delicious and the service was excellent.'
        });
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty('embedding');
      expect(Array.isArray(response.body.data[0].embedding)).toBe(true);
    });
    
    it('should return 400 for invalid request', async () => {
      const response = await request(app)
        .post('/v1/embeddings')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          // Missing required fields
        });
        
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'invalid_request_error');
    });
  });
  
  describe('Providers Endpoint', () => {
    it('should return a list of providers', async () => {
      const response = await request(app)
        .get('/v1/providers')
        .set('Authorization', 'Bearer test-api-key');
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should return a specific provider', async () => {
      const response = await request(app)
        .get('/v1/providers/provider-1')
        .set('Authorization', 'Bearer test-api-key');
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'provider-1');
      expect(response.body).toHaveProperty('object', 'provider');
    });
    
    it('should return 404 for non-existent provider', async () => {
      const response = await request(app)
        .get('/v1/providers/non-existent-provider')
        .set('Authorization', 'Bearer test-api-key');
        
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'invalid_request_error');
      expect(response.body.error).toHaveProperty('code', 'provider_not_found');
    });
  });
  
  describe('Authentication', () => {
    it('should return 401 when no API key is provided', async () => {
      const response = await request(app).get('/v1/models');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'authentication_error');
      expect(response.body.error).toHaveProperty('code', 'invalid_api_key');
    });
    
    it('should return 401 when invalid API key is provided', async () => {
      const response = await request(app)
        .get('/v1/models')
        .set('Authorization', 'Bearer invalid-api-key');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'authentication_error');
      expect(response.body.error).toHaveProperty('code', 'invalid_api_key');
    });
  });
  
  describe('Rate Limiting', () => {
    it('should apply rate limiting after too many requests', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 101; i++) {
        requests.push(
          request(app)
            .get('/v1/models')
            .set('Authorization', 'Bearer test-api-key')
        );
      }
      
      const responses = await Promise.all(requests);
      
      // At least one response should be rate limited
      const rateLimitedResponse = responses.find(r => r.status === 429);
      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body).toHaveProperty('error');
      expect(rateLimitedResponse.body.error).toHaveProperty('type', 'rate_limit_error');
      expect(rateLimitedResponse.body.error).toHaveProperty('code', 'rate_limit_exceeded');
    });
  });
});
