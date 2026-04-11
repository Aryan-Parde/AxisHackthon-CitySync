const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// ── WhatsApp Twilio Webhook ──
// POST: Receives incoming WhatsApp messages
router.post('/webhook', whatsappController.webhook);

// GET: Webhook health check / verification
router.get('/webhook', whatsappController.verify);

// POST: Send a test message (admin/debug only)
router.post('/test', whatsappController.testMessage);

module.exports = router;
