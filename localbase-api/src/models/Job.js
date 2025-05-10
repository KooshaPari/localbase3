/**
 * LocalBase API Gateway
 * Job model
 */

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  model: {
    type: String,
    required: true
  },
  provider_id: {
    type: String,
    required: true
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  parameters: {
    type: Object,
    default: {}
  },
  result: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  error: {
    type: String
  },
  blockchain_job_id: {
    type: String
  },
  usage: {
    input_tokens: {
      type: Number
    },
    output_tokens: {
      type: Number
    },
    total_tokens: {
      type: Number
    }
  },
  cost: {
    type: Number
  },
  started_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  failed_at: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { 
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Create indexes for efficient queries
jobSchema.index({ user: 1, created_at: -1 });
jobSchema.index({ provider_id: 1, status: 1 });
jobSchema.index({ model: 1, status: 1 });
jobSchema.index({ blockchain_job_id: 1 }, { sparse: true });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
