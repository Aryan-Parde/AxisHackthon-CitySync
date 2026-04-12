require('dotenv').config();
const twilio = require('twilio');

async function testTwilioOutbound() {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    console.log('Fetching last 5 outbound messages from WhatsApp...');
    const messages = await client.messages.list({ 
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, 
      limit: 5 
    });
    console.log(`Found ${messages.length} outbound messages:`);
    messages.forEach(m => {
      console.log(`- To: ${m.to}, Body: ${m.body.substring(0, 50)}, Status: ${m.status}, ErrorCode: ${m.errorCode}, SID: ${m.sid}`);
    });
  } catch (err) {
    console.error('Twilio Error:', err.message);
  }
}

testTwilioOutbound();
