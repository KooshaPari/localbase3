/**
 * LocalBase API Gateway
 * Transaction model
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'job_payment', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance_after: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  provider_id: {
    type: String
  },
  blockchain_tx: {
    type: String
  },
  metadata: {
    type: Object
  },
  created_at: {
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
transactionSchema.index({ user: 1, created_at: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ job: 1 }, { sparse: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
