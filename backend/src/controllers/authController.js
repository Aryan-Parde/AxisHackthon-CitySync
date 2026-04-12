const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTPService = require('../services/otpService');
const config = require('../config/env');

// @desc    Authority login with username/password
// @route   POST /api/auth/authority-login
// @access  Public
exports.authorityLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Find user by username, include password field
    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, message: 'This account does not have password-based login. Use OTP instead.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, mobile: user.mobile, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          mobile: user.mobile,
          name: user.name,
          username: user.username,
          role: user.role,
          isVerified: true
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to mobile number
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res, next) => {
  try {
    let { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    // Normalize mobile number
    mobile = mobile.trim();
    if (!mobile.startsWith('+91')) {
      mobile = '+91' + mobile.replace(/^0+/, '');
    }

    // Validate format
    if (!/^\+91\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number. Use 10-digit Indian number.' });
    }

    // Check rate limit per mobile
    const canSend = await OTPService.canSendOTP(mobile);
    if (!canSend.allowed) {
      return res.status(429).json({ success: false, message: canSend.message });
    }

    // Generate and store OTP
    const result = await OTPService.createOTP(mobile);

    res.status(200).json({
      success: true,
      message: result.smsSent ? `OTP sent to ${mobile}` : `OTP generated for ${mobile} (check backend console)`,
      data: { mobile, smsSent: result.smsSent }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and login/register
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    let { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
    }

    // Normalize mobile
    mobile = mobile.trim();
    if (!mobile.startsWith('+91')) {
      mobile = '+91' + mobile.replace(/^0+/, '');
    }

    // Verify OTP
    const verification = await OTPService.verifyOTP(mobile, otp);

    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    // Find or create user
    let user = await User.findOne({ mobile });

    if (!user) {
      user = await User.create({
        mobile,
        isVerified: true,
        role: 'citizen'
      });
    } else {
      user.isVerified = true;
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, mobile: user.mobile, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          mobile: user.mobile,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-__v')
      .populate('department', 'name code');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select('-__v');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
