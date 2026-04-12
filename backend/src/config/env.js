const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  mapboxToken: process.env.MAPBOX_ACCESS_TOKEN,
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3,
};
