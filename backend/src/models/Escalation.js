const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  fromLevel: {
    type: Number,
    required: true
  },
  toLevel: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: 'Auto-escalated due to SLA breach'
  },
  escalatedAt: {
    type: Date,
    default: Date.now
  },
  escalatedTo: {
    designation: String,
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    }
  },
  response: {
    type: String,
    default: ''
  },
  respondedAt: {
    type: Date
  },
  pilDraft: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'resolved'],
    default: 'pending'
  }
}, {
  timestamps: true
});

escalationSchema.index({ complaint: 1 });
escalationSchema.index({ status: 1 });

module.exports = mongoose.model('Escalation', escalationSchema);
