const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');
const config = require('../config/env');
const twilio = require('twilio');

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

class OTPService {
  // Generate a 6-digit OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create and store OTP
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

    // Try to send via Twilio if configured
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: `CitySync: Your OTP code is ${otp}. It expires in ${config.otpExpiryMinutes} minutes. Do not share this with anyone.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: mobile
        });
        console.log(`\n✅ SMS successfully sent to ${mobile} via Twilio!`);
      } catch (err) {
        console.error('Failed to send SMS via Twilio. Check your Twilio Console:', err.message);
      }
    }

    // Always log to console for hackathon demo purposes
    console.log(`\n📱 ========================================`);
    console.log(`   OTP for ${mobile}: ${otp}`);
    console.log(`   Expires in ${config.otpExpiryMinutes} minutes`);
    console.log(`   ========================================\n`);

    return { success: true, otpId: otpDoc._id };
  }

  // Verify OTP
  static async verifyOTP(mobile, otpInput) {
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

  // Check rate limit for OTP requests (per mobile number)
  static async canSendOTP(mobile) {
    const recentOTPs = await OTP.countDocuments({
      mobile,
      createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) }
    });

    if (recentOTPs >= 3) {
      return { allowed: false, message: 'Too many OTP requests. Please wait 15 minutes.' };
    }

    return { allowed: true };
  }
}

module.exports = OTPService;
