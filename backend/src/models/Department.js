const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    default: ''
  },
  categories: [{
    type: String,
    enum: ['pothole', 'garbage', 'streetlight', 'water_supply', 'sewage', 'road_damage', 'noise', 'illegal_construction', 'traffic', 'drainage', 'other']
  }],
  zones: [{
    type: String
  }],
  contacts: [{
    name: String,
    mobile: String,
    designation: String,
    zone: String
  }],
  escalationChain: [{
    level: { type: Number, required: true },
    designation: String,
    autoEscalateAfterHours: { type: Number, default: 24 }
  }],
  avgResolutionHours: {
    type: Number,
    default: 72
  },
  performanceScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  totalComplaints: {
    type: Number,
    default: 0
  },
  resolvedComplaints: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: '🏢'
  }
}, {
  timestamps: true
});

departmentSchema.index({ code: 1 });
departmentSchema.index({ categories: 1 });

module.exports = mongoose.model('Department', departmentSchema);
