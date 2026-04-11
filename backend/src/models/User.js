const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
    match: [/^\+91\d{10}$/, 'Please enter a valid Indian mobile number with +91 prefix']
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['citizen', 'admin', 'authority'],
    default: 'citizen'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  avatar: {
    type: String,
    default: ''
  },
  complaintsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

userSchema.index({ mobile: 1 });

module.exports = mongoose.model('User', userSchema);
