require('dotenv').config();
const twilio = require('twilio');

async function testTwilioFilter() {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    const toNum = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`;
    console.log(`Filtering for messages sent to: ${toNum}`);
    
    // Test without date filter first
    const messages = await client.messages.list({
      to: toNum,
      limit: 5
    });
    
    console.log(`Found ${messages.length} messages to this number:`);
    messages.forEach(m => {
      console.log(`- From: ${m.from}, To: ${m.to}, Body: ${m.body}, SID: ${m.sid}`);
    });
    
  } catch (err) {
    console.error('Twilio Error:', err.message);
  }
}

testTwilioFilter();
