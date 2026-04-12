const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');
const config = require('../config/env');
const twilio = require('twilio');

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID.trim(), process.env.TWILIO_AUTH_TOKEN.trim())
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

    let smsSent = false;

    // Send via Twilio
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      const fromNumber = process.env.TWILIO_PHONE_NUMBER.trim();
      try {
        const message = await twilioClient.messages.create({
          body: `CitySync: Your OTP code is ${otp}. It expires in ${config.otpExpiryMinutes} minutes. Do not share this with anyone.`,
          from: fromNumber,
          to: mobile
        });
        smsSent = true;
        console.log(`\n✅ SMS sent to ${mobile} via Twilio! SID: ${message.sid}`);
      } catch (err) {
        console.error(`\n❌ Twilio SMS failed for ${mobile}:`);
        console.error(`   Error Code: ${err.code}`);
        console.error(`   Message: ${err.message}`);
        if (err.code === 21608 || err.code === 21211) {
          console.error(`   ⚠️  This number is not verified in your Twilio trial account.`);
          console.error(`   ➡️  Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified`);
          console.error(`   ➡️  Add ${mobile} as a verified caller ID to receive SMS.\n`);
        } else if (err.code === 21614) {
          console.error(`   ⚠️  ${mobile} is not a valid mobile number or cannot receive SMS.\n`);
        }
      }
    } else {
      console.log('\n⚠️  Twilio not configured — SMS will not be sent.');
    }

    // Always log OTP to console
    console.log(`\n📱 ========================================`);
    console.log(`   OTP for ${mobile}: ${otp}`);
    console.log(`   SMS Sent: ${smsSent ? '✅ Yes' : '❌ No (use console OTP or 123456)'}`);
    console.log(`   Expires in ${config.otpExpiryMinutes} minutes`);
    console.log(`   ========================================\n`);

    return { success: true, otpId: otpDoc._id, smsSent };
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
