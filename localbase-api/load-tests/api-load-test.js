import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errors = new Counter('errors');
const tokenRefreshes = new Counter('token_refreshes');
const apiCalls = new Counter('api_calls');
const apiCallDuration = new Trend('api_call_duration');
const successRate = new Rate('success_rate');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users over 30 seconds
    { duration: '1m', target: 10 },  // Stay at 10 users for 1 minute
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'api_call_duration': ['p(95)<1000'], // 95% of API calls should be below 1000ms
    'success_rate': ['rate>0.95'], // 95% of requests should be successful
  },
};

// Simulated API key
const API_KEY = 'lb_test_key_for_load_testing';

// Base URL for the API
const BASE_URL = 'http://localhost:8000';

// Endpoints to test
const ENDPOINTS = {
  models: `${BASE_URL}/v1/models`,
  chat: `${BASE_URL}/v1/chat/completions`,
  completions: `${BASE_URL}/v1/completions`,
  embeddings: `${BASE_URL}/v1/embeddings`,
};

// Test data for different endpoints
const TEST_DATA = {
  chat: {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you?' }
    ],
    max_tokens: 50,
  },
  completions: {
    model: 'gpt-3.5-turbo',
    prompt: 'Once upon a time',
    max_tokens: 50,
  },
  embeddings: {
    model: 'text-embedding-ada-002',
    input: 'The food was delicious and the service was excellent.',
  },
};

// Helper function to make API calls with timing
function makeApiCall(url, method = 'GET', payload = null) {
  const startTime = new Date();
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  };
  
  let response;
  if (method === 'GET') {
    response = http.get(url, params);
  } else {
    response = http.post(url, JSON.stringify(payload), params);
  }
  
  const duration = new Date() - startTime;
  apiCallDuration.add(duration);
  apiCalls.add(1);
  
  const success = response.status >= 200 && response.status < 300;
  successRate.add(success);
  
  if (!success) {
    errors.add(1);
    console.log(`Error: ${response.status} - ${response.body}`);
  }
  
  return { response, duration };
}

// Main test function
export default function() {
  // Test GET /v1/models
  const modelsResult = makeApiCall(ENDPOINTS.models);
  check(modelsResult.response, {
    'models status is 200': (r) => r.status === 200,
    'models response has data array': (r) => JSON.parse(r.body).data !== undefined,
  });
  
  // Test POST /v1/chat/completions
  const chatResult = makeApiCall(ENDPOINTS.chat, 'POST', TEST_DATA.chat);
  check(chatResult.response, {
    'chat status is 200': (r) => r.status === 200,
    'chat response has choices': (r) => JSON.parse(r.body).choices !== undefined,
  });
  
  // Test POST /v1/completions
  const completionsResult = makeApiCall(ENDPOINTS.completions, 'POST', TEST_DATA.completions);
  check(completionsResult.response, {
    'completions status is 200': (r) => r.status === 200,
    'completions response has choices': (r) => JSON.parse(r.body).choices !== undefined,
  });
  
  // Test POST /v1/embeddings
  const embeddingsResult = makeApiCall(ENDPOINTS.embeddings, 'POST', TEST_DATA.embeddings);
  check(embeddingsResult.response, {
    'embeddings status is 200': (r) => r.status === 200,
    'embeddings response has data': (r) => JSON.parse(r.body).data !== undefined,
  });
  
  // Sleep between iterations to simulate real user behavior
  sleep(1);
}
