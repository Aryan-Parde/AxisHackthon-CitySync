const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/rateLimit');

router.post('/send-otp', otpSendLimiter, sendOTP);
router.post('/verify-otp', otpVerifyLimiter, verifyOTP);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
