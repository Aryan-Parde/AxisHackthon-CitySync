require('dotenv').config();
const twilio = require('twilio');

async function testTwilio() {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    console.log('Fetching last 5 messages...');
    const messages = await client.messages.list({ limit: 5 });
    console.log(`Found ${messages.length} messages:`);
    messages.forEach(m => {
      console.log(`- From: ${m.from}, To: ${m.to}, Body: ${m.body}, Status: ${m.status}, SID: ${m.sid}`);
    });
  } catch (err) {
    console.error('Twilio Error:', err.message);
  }
}

testTwilio();
