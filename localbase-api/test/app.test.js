/**
 * LocalBase API Gateway
 * Application tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('API Gateway', () => {
  describe('Health Check', () => {
    it('should return 200 OK for health check', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
  
  describe('Authentication', () => {
    it('should return 401 for missing API key', async () => {
      const response = await request(app).get('/v1/models');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'authentication_error');
    });
    
    it('should return 401 for invalid API key', async () => {
      const response = await request(app)
        .get('/v1/models')
        .set('Authorization', 'Bearer invalid_key');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'authentication_error');
    });
  });
  
  describe('Models Endpoints', () => {
    it('should list models with valid API key', async () => {
      const response = await request(app)
        .get('/v1/models')
        .set('Authorization', 'Bearer lb_sk_test123456789');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should get model details with valid API key', async () => {
      const response = await request(app)
        .get('/v1/models/lb-llama-3-70b')
        .set('Authorization', 'Bearer lb_sk_test123456789');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'lb-llama-3-70b');
      expect(response.body).toHaveProperty('object', 'model');
    });
    
    it('should return 404 for non-existent model', async () => {
      const response = await request(app)
        .get('/v1/models/non-existent-model')
        .set('Authorization', 'Bearer lb_sk_test123456789');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'invalid_request_error');
    });
  });
  
  describe('Chat Completions Endpoint', () => {
    it('should create a chat completion with valid request', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .set('Authorization', 'Bearer lb_sk_test123456789')
        .send({
          model: 'lb-llama-3-70b',
          messages: [
            {
              role: 'user',
              content: 'Hello!'
            }
          ]
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
    
    it('should return 400 for missing model', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .set('Authorization', 'Bearer lb_sk_test123456789')
        .send({
          messages: [
            {
              role: 'user',
              content: 'Hello!'
            }
          ]
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('param', 'model');
    });
    
    it('should return 400 for missing messages', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .set('Authorization', 'Bearer lb_sk_test123456789')
        .send({
          model: 'lb-llama-3-70b'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('param', 'messages');
    });
  });
  
  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .set('Authorization', 'Bearer lb_sk_test123456789');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('type', 'invalid_request_error');
      expect(response.body.error).toHaveProperty('code', 'route_not_found');
    });
  });
});
