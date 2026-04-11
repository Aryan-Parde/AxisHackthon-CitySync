const rateLimit = require('express-rate-limit');

// OTP sending rate limiter - relaxed for demo/hackathon
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 999,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP verify rate limiter - relaxed for demo/hackathon
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 999,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otpSendLimiter, otpVerifyLimiter, apiLimiter };
