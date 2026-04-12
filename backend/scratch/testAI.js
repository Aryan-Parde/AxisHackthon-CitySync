require('dotenv').config();
const AIService = require('../src/services/aiService');

async function testAI() {
  try {
    console.log('Testing AI classification...');
    const result = await AIService.classifyComplaint('There is garbage on the road');
    console.log('AI Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('AI Error:', err.message);
  }
}

testAI();
