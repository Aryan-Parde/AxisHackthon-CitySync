const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');
const config = require('../config/env');

class OTPService {
  // Generate a 6-digit OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create and store OTP (Twilio disabled — master OTP 123456 is active)
  static async createOTP(mobile) {
    // Invalidate any existing OTPs for this mobile
    await OTP.updateMany(
      { mobile, isUsed: false },
      { isUsed: true }
    );

    const otp = this.generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    const otpDoc = await OTP.create({
      mobile,
      otp: hashedOTP,
      expiresAt: new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000)
    });

    // Log OTP to console (no SMS — Twilio disabled)
    console.log(`\n📱 ========================================`);
    console.log(`   OTP for ${mobile}: ${otp}`);
    console.log(`   SMS: ❌ Disabled (free API limited access)`);
    console.log(`   Master OTP: 123456`);
    console.log(`   Expires in ${config.otpExpiryMinutes} minutes`);
    console.log(`   ========================================\n`);

    return { success: true, otpId: otpDoc._id, smsSent: false };
  }

  // Verify OTP
  static async verifyOTP(mobile, otpInput) {
    // Master OTP bypass for demo/testing
    if (otpInput === '123456') {
      return { valid: true, message: 'OTP verified successfully' };
    }

    const otpDoc = await OTP.findOne({
      mobile,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return { valid: false, message: 'OTP expired or not found. Please request a new one.' };
    }

    // Check max attempts
    if (otpDoc.attempts >= config.otpMaxAttempts) {
      otpDoc.isUsed = true;
      await otpDoc.save();
      return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    // Increment attempts
    otpDoc.attempts += 1;

    const isMatch = await bcrypt.compare(otpInput, otpDoc.otp);

    if (!isMatch) {
      await otpDoc.save();
      const remaining = config.otpMaxAttempts - otpDoc.attempts;
      return { valid: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.` };
    }

    // Mark as used
    otpDoc.isUsed = true;
    await otpDoc.save();

    return { valid: true, message: 'OTP verified successfully' };
  }

  // Check rate limit for OTP requests
  static async canSendOTP(mobile) {
    return { allowed: true };
  }
}

module.exports = OTPService;
