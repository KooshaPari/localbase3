/**
 * LocalBase API Gateway
 * API Key model
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: 'Default API Key'
  },
  active: {
    type: Boolean,
    default: true
  },
  last_used: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date
  }
}, {
  timestamps: { 
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Create indexes for efficient queries
apiKeySchema.index({ user: 1 });
apiKeySchema.index({ key: 1, active: 1 });

// Static method to generate a new API key
apiKeySchema.statics.generateKey = function(prefix = 'lb_sk_') {
  return `${prefix}${crypto.randomBytes(16).toString('hex')}`;
};

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;
