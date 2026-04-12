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
    // Fetch messages received in the last 1 minute (overlapping window)
    // This ensures no messages are missed even if the script restarts or lags.
    // We rely on processedSids to avoid duplicate processing.
    const oneMinuteAgo = new Date(Date.now() - 60000);
    
    const messages = await client.messages.list({
      to: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`,
      dateSentAfter: oneMinuteAgo,
      limit: 20
    });

    if (messages.length > 0) {
      console.log(`\n🔍 Polled ${messages.length} recent messages...`);
    }

    for (const msg of messages) {
      // Skip already processed
      if (processedSids.has(msg.sid)) continue;
      processedSids.add(msg.sid);

      // Skip outgoing messages
      if (msg.direction !== 'inbound') continue;

      console.log(`\n📨 NEW WHATSAPP MESSAGE:`);
      console.log(`   SID:  ${msg.sid}`);
      console.log(`   From: ${msg.from}`);
      console.log(`   Body: ${msg.body}`);

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
            console.log(`   Media: ${webhookData.MediaUrl0}`);
          }
        } catch (e) {
          console.error('   ❌ Failed to fetch media:', e.message);
        }
      }

      // Process through our WhatsApp handler
      try {
        await WhatsAppService.handleIncoming(webhookData);
        console.log(`   ✅ Processed successfully`);
      } catch (err) {
        console.error(`   ❌ Processing error:`, err.message);
      }
    }
    
    // Cleanup processedSids occasionally to prevent memory bloat
    if (processedSids.size > 1000) {
      const sidsArray = Array.from(processedSids);
      const toKeep = sidsArray.slice(-500); // Keep last 500
      processedSids.clear();
      toKeep.forEach(sid => processedSids.add(sid));
    }

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
