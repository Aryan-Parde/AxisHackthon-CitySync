/**
 * WhatsApp Polling Service
 * ─────────────────────────
 * Since tunneling tools (ngrok, localtunnel, cloudflared) are blocked
 * by the current network, this service polls Twilio for new incoming
 * WhatsApp messages and processes them through our WhatsApp handler.
 *
 * Usage: node src/services/whatsappPoller.js
 */

require('dotenv').config();
const twilio = require('twilio');
const WhatsAppService = require('./whatsappService');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Track last processed message timestamp
let lastChecked = new Date();
const processedSids = new Set();

async function pollMessages() {
  try {
    // Fetch messages received AFTER our last check
    const messages = await client.messages.list({
      to: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`,
      dateSentAfter: lastChecked,
      limit: 10
    });

    for (const msg of messages) {
      // Skip already processed
      if (processedSids.has(msg.sid)) continue;
      processedSids.add(msg.sid);

      // Skip outgoing messages
      if (msg.direction !== 'inbound') continue;

      console.log(`\n📨 New WhatsApp message detected!`);
      console.log(`   From: ${msg.from}`);
      console.log(`   Body: ${msg.body}`);
      console.log(`   Media: ${msg.numMedia}`);

      // Build a Twilio-webhook-like object
      const webhookData = {
        From: msg.from,
        Body: msg.body || '',
        NumMedia: msg.numMedia || '0',
      };

      // If there's media, fetch the URL
      if (parseInt(msg.numMedia) > 0) {
        try {
          const mediaList = await client.messages(msg.sid).media.list();
          if (mediaList.length > 0) {
            webhookData.MediaUrl0 = `https://api.twilio.com${mediaList[0].uri.replace('.json', '')}`;
          }
        } catch (e) {
          console.error('Failed to fetch media:', e.message);
        }
      }

      // Process through our WhatsApp handler
      await WhatsAppService.handleIncoming(webhookData);
    }

    lastChecked = new Date();
  } catch (error) {
    console.error('Polling error:', error.message);
  }
}

async function start() {
  // Connect to MongoDB
  await connectDB();
  console.log('\n🔄 ═══════════════════════════════════════');
  console.log('   WhatsApp Polling Service Started');
  console.log('   Checking for new messages every 3 seconds');
  console.log('   Press Ctrl+C to stop');
  console.log('═══════════════════════════════════════\n');

  // Poll every 3 seconds
  setInterval(pollMessages, 3000);

  // Initial poll
  pollMessages();
}

start().catch(console.error);
