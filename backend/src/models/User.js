const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  // Authority login fields
  username: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    unique: true
  },
  password: {
    type: String,
    select: false  // Don't return password by default
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
userSchema.index({ username: 1 }, { sparse: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
