const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['pothole', 'garbage', 'streetlight', 'water_supply', 'sewage', 'road_damage', 'noise', 'illegal_construction', 'traffic', 'drainage', 'other'],
    default: 'other'
  },
  images: [{
    type: String // Base64 or URL
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    },
    address: {
      type: String,
      default: ''
    },
    ward: {
      type: String,
      default: ''
    },
    zone: {
      type: String,
      default: ''
    }
  },
  priority: {
    level: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium'
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    factors: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'escalated', 'fake'],
    default: 'submitted'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  },
  duplicateCount: {
    type: Number,
    default: 1
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  estimatedResolution: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  escalationLevel: {
    type: Number,
    default: 0
  },
  aiMetadata: {
    classificationConfidence: { type: Number, default: 0 },
    suggestedCategory: { type: String, default: '' },
    keywords: [String],
    embedding: [Number]
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resolution: {
    photo: { type: String, default: '' },       // Base64 or URL of resolution photo
    actionTaken: { type: String, default: '' },  // Officer's action report
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    aiVerification: {
      verified: { type: Boolean, default: false },
      score: { type: Number, default: 0 },       // 0-100 confidence
      analysis: { type: String, default: '' }     // AI explanation
    }
  }
}, {
  timestamps: true
});

// Geospatial index for location-based queries
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ ticketId: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ citizen: 1 });
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

// Generate ticket ID before save
complaintSchema.pre('validate', async function(next) {
  if (this.isNew && !this.ticketId) {
    const count = await mongoose.model('Complaint').countDocuments();
    const year = new Date().getFullYear();
    this.ticketId = `CS-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
