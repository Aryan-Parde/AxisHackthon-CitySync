const WhatsAppService = require('../services/whatsappService');
const twilio = require('twilio');

// @desc    WhatsApp Webhook - receives incoming messages from Twilio
// @route   POST /api/whatsapp/webhook
// @access  Public (Twilio webhook)
exports.webhook = async (req, res) => {
  try {
    // Twilio sends form-urlencoded data
    const message = req.body;

    console.log('\n📲 ═══ WhatsApp Webhook Received ═══');
    console.log(`   From: ${message.From}`);
    console.log(`   Body: ${message.Body}`);
    console.log(`   Media: ${message.NumMedia || 0} files`);
    console.log('═══════════════════════════════════\n');

    // Process the message asynchronously
    WhatsAppService.handleIncoming(message).catch(err => {
      console.error('WhatsApp async handler error:', err);
    });

    // Respond immediately with empty TwiML (Twilio expects this)
    // We send our reply separately via the API
    const twiml = new twilio.twiml.MessagingResponse();
    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).send('Error');
  }
};

// @desc    WhatsApp Webhook verification (GET)
// @route   GET /api/whatsapp/webhook
// @access  Public
exports.verify = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CitySync WhatsApp Webhook is active',
    timestamp: new Date().toISOString()
  });
};

// @desc    Send a test WhatsApp message (for debugging)
// @route   POST /api/whatsapp/test
// @access  Private (admin)
exports.testMessage = async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message are required' });
    }

    const result = await WhatsAppService._sendMessage(phone, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
