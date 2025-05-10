/**
 * LocalBase API Gateway
 * Express application setup
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Create Express application
const app = express();

// Apply security middleware
app.use(helmet());
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json({
  limit: '1mb' // Limit request size
}));

// Apply global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests, please try again later',
      type: 'rate_limit_error',
      code: 'rate_limit_exceeded'
    }
  }
});
app.use(limiter);

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Import routes
const modelsRoutes = require('./routes/models');
const chatRoutes = require('./routes/chat');
const completionsRoutes = require('./routes/completions');
const embeddingsRoutes = require('./routes/embeddings');
const providersRoutes = require('./routes/providers');

// Apply routes
app.use('/v1/models', modelsRoutes);
app.use('/v1/chat', chatRoutes);
app.use('/v1/completions', completionsRoutes);
app.use('/v1/embeddings', embeddingsRoutes);
app.use('/v1/providers', providersRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      message: `Cannot ${req.method} ${req.path}`,
      type: 'invalid_request_error',
      code: 'route_not_found'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
