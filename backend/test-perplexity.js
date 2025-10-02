const axios = require('axios');
require('dotenv').config();

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  const apiUrl = 'https://api.perplexity.ai/chat/completions';
  const model = 'sonar';

  console.log('Testing Perplexity API...');
  console.log('API Key (first 15 chars):', apiKey?.substring(0, 15) + '...');
  console.log('API URL:', apiUrl);
  console.log('Model:', model);
  console.log('');

  try {
    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Say hello'
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      }
    );

    console.log('SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('=== PERPLEXITY API ERROR ===');
    console.error('Error Message:', error.message);

    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Status Text:', error.response.statusText);
      console.error('Response Data:', error.response.data);
      console.error('Response Headers:', error.response.headers);
    }

    if (error.config) {
      console.error('Request URL:', error.config.url);
      console.error('Request Method:', error.config.method);
      console.error('Request Headers:', error.config.headers);
    }

    console.error('===========================');
  }
}

testPerplexityAPI();
