const axios = require('axios');

class PerplexityScraper {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.PERPLEXITY_API_KEY;
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    this.model = config.model || 'sonar'; // Sonar model with web search
  }

  async scrape(passportCountry, residenceCountry, destinationCountry) {
    try {
      console.log(`[Perplexity] Getting visa data for ${passportCountry.name} -> ${destinationCountry.name} with web search`);

      const prompt = this.buildPrompt(passportCountry, residenceCountry, destinationCountry);

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a visa requirements expert. Search the web for accurate, up-to-date information from official sources (embassy websites, VFS Global, government sites). Provide information in JSON format only. Always cite your sources.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for factual responses
          max_tokens: 2000,
          return_citations: true, // Get source URLs
          return_images: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 45000 // Perplexity searches take longer
        }
      );

      // Extract the response text
      const aiResponse = response.data.choices[0].message.content;

      // Extract citations (source URLs)
      const citations = response.data.citations || [];

      // Parse the JSON response - Perplexity might wrap it in markdown
      let visaData;
      try {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
                         aiResponse.match(/```\n?([\s\S]*?)\n?```/);

        if (jsonMatch) {
          visaData = JSON.parse(jsonMatch[1]);
        } else {
          visaData = JSON.parse(aiResponse);
        }
      } catch (parseError) {
        console.error('Perplexity response parsing error:', parseError);
        console.log('Raw response:', aiResponse);
        throw new Error('Failed to parse Perplexity response as JSON');
      }

      // Structure the data for our database
      return {
        success: true,
        data: {
          visa_status: visaData.visa_status,
          required_documents: JSON.stringify(visaData.required_documents),
          application_steps: JSON.stringify(visaData.application_steps),
          application_location: visaData.application_location,
          contact_info: JSON.stringify(visaData.contact_info),
          application_form_url: visaData.application_form_url || null,
          checklist_url: visaData.checklist_url || null,
          visa_fee: visaData.visa_fee,
          processing_time: visaData.processing_time,
          booking_link: visaData.booking_link || null,
          source_urls: JSON.stringify(citations.length > 0 ? citations : [`Perplexity AI (${this.model}) - ${new Date().toISOString()}`])
        }
      };

    } catch (error) {
      console.error('=== Perplexity API Error Details ===');
      console.error('Error Message:', error.message);
      console.error('Has Response:', !!error.response);

      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Status Text:', error.response.statusText);
        console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
      }

      if (error.config) {
        console.error('Request URL:', error.config.url);
        console.error('Request Method:', error.config.method);
        console.error('Request Headers:', JSON.stringify(error.config.headers, null, 2));
        console.error('API Key (first 10 chars):', this.apiKey?.substring(0, 10) + '...');
        console.error('Model:', this.model);
      }

      console.error('Full Error:', error);
      console.error('=================================');

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  buildPrompt(passportCountry, residenceCountry, destinationCountry) {
    return `Search the web for accurate visa requirement information for the following travel scenario:

- Passport Country: ${passportCountry.name} (${passportCountry.code})
- Current Residence: ${residenceCountry.name} (${residenceCountry.code})
- Destination Country: ${destinationCountry.name} (${destinationCountry.code})
- Visa Type: Tourist/Short Stay
- Year: 2024/2025

IMPORTANT SEARCH INSTRUCTIONS:
1. Search for OFFICIAL sources only: embassy websites, VFS Global, TLScontact, government visa portals
2. Verify information from multiple official sources when possible
3. For "application_location", CAREFULLY verify the ACTUAL application process:
   a. First, search whether ${destinationCountry.name} uses VFS Global OR TLScontact in ${residenceCountry.name}
   b. If you find NO evidence of VFS Global/TLScontact, the application is at the ${destinationCountry.name} embassy/consulate in ${residenceCountry.name}
   c. ONLY mention VFS Global or TLScontact if you find SPECIFIC evidence they handle ${destinationCountry.name} visas in ${residenceCountry.name}
   d. Many countries do NOT use VFS Global - verify before assuming
4. DO NOT assume VFS Global is used unless you find clear evidence in official sources
5. DO NOT guess or make assumptions - if you cannot find official information, indicate "Contact local embassy"
6. CRITICAL: ALL URLs must be REAL, WORKING links found in your web search - do NOT generate or construct URLs
7. If you cannot find a specific URL from official sources, return null instead of making one up

STRICT URL REQUIREMENTS:
- "website": Must be the EXACT URL from your web search results for the ${destinationCountry.name} embassy in ${residenceCountry.name}
- "application_form_url": Must be a REAL URL you found that links directly to the visa application form
- "checklist_url": Must be a REAL URL you found that links to the document checklist
- "booking_link": Must be a REAL URL you found for appointment booking (VFS Global, embassy, etc.)
- If you cannot find any of these URLs from official sources in your search, use null instead

Return your response in the following JSON format ONLY (no markdown, no explanations):

{
  "visa_status": "required|not_required|visa_on_arrival|evisa",
  "required_documents": [
    "Document 1 with specific details",
    "Document 2 with specific details",
    "Document 3 with specific details"
  ],
  "application_steps": [
    "Step 1 description",
    "Step 2 description",
    "Step 3 description"
  ],
  "application_location": "Where to apply - MUST be based on search results (e.g., 'VFS Global Center in [city]', '[Country] Embassy in [city]', 'Online via [official portal]')",
  "contact_info": {
    "embassy": "Embassy name from official source",
    "address": "Actual embassy address in ${residenceCountry.name}",
    "phone": "Actual contact phone number",
    "email": "Actual contact email",
    "website": "EXACT official embassy website URL from search results or null"
  },
  "application_form_url": "REAL working URL from search results or null",
  "checklist_url": "REAL working URL from search results or null",
  "visa_fee": "Fee amount with currency (from official source)",
  "processing_time": "Estimated processing time (from official source)",
  "booking_link": "REAL working URL from search results or null"
}

Return ONLY valid JSON, no markdown formatting, no code blocks.`;
  }
}

module.exports = PerplexityScraper;
 
