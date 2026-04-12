const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const connectDB = require('./config/db');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const EscalationService = require('./services/escalationService');

// Route imports
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const mapRoutes = require('./routes/map');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: '*', // Allow Vercel frontend to connect
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CitySync API is running',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv
  });
});

// Error handler
app.use(errorHandler);

// Auto-escalation cron job - run every hour
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Running auto-escalation check...');
  await EscalationService.checkAndEscalate();
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🏙️  CitySync API Server`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔑 Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;






 
 
 
 
  
