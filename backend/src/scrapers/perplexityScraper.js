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
    return `Search the web for ${destinationCountry.name} visa requirements for ${passportCountry.name} passport holders currently residing in ${residenceCountry.name}.

TRAVEL SCENARIO:
- Passport Country: ${passportCountry.name} (${passportCountry.code})
- Current Residence: ${residenceCountry.name} (${residenceCountry.code})
- Destination Country: ${destinationCountry.name} (${destinationCountry.code})
- Visa Type: Tourist/Short Stay
- Year: 2024/2025

CRITICAL SEARCH FOCUS - Search for information FROM the DESTINATION country (${destinationCountry.name}):
1. "${destinationCountry.name} visa requirements for ${passportCountry.name} citizens"
2. "${destinationCountry.name} embassy in ${residenceCountry.name}"
3. "${destinationCountry.name} official visa portal" or "${destinationCountry.name} e-visa"
4. "${destinationCountry.name} ministry of foreign affairs visa information"
5. "How to apply for ${destinationCountry.name} visa from ${residenceCountry.name}"

STRICT SOURCE REQUIREMENTS - Only use official ${destinationCountry.name} sources:
✓ ${destinationCountry.name} government visa portals (.gov domains)
✓ ${destinationCountry.name} embassy/consulate websites in ${residenceCountry.name}
✓ ${destinationCountry.name} Ministry of Foreign Affairs
✓ Official ${destinationCountry.name} e-visa platforms
✓ VFS Global or TLScontact ONLY if they are confirmed to handle ${destinationCountry.name} visas
✗ DO NOT use ${passportCountry.name} or ${residenceCountry.name} government websites
✗ DO NOT use travel blogs, forums, or unofficial sources
✗ DO NOT use generic visa information aggregators

APPLICATION LOCATION VERIFICATION:
1. Search specifically: "where to apply for ${destinationCountry.name} visa in ${residenceCountry.name}"
2. Look for: "${destinationCountry.name} embassy ${residenceCountry.name} visa application"
3. Check if ${destinationCountry.name} uses VFS Global/TLScontact in ${residenceCountry.name} - ONLY mention if confirmed
4. If no VFS/TLS: application is at ${destinationCountry.name} embassy/consulate in ${residenceCountry.name}
5. For e-visa countries: specify the official ${destinationCountry.name} e-visa portal

URL VALIDATION - ALL URLs must be from ${destinationCountry.name} official sources:
- "website": ${destinationCountry.name} embassy in ${residenceCountry.name} official website
- "application_form_url": Official ${destinationCountry.name} visa application form (government or embassy site)
- "checklist_url": Official ${destinationCountry.name} document checklist
- "booking_link": Official ${destinationCountry.name} appointment system or verified VFS/TLS link
- If URLs not found from official ${destinationCountry.name} sources: use null
- DO NOT include Google search links, travel blogs, or generic visa sites

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
  "application_location": "Where to apply - based on ${destinationCountry.name} official sources (e.g., '${destinationCountry.name} Embassy in [city]', 'Online via ${destinationCountry.name} e-visa portal', or 'VFS Global Center in [city]' if confirmed)",
  "contact_info": {
    "embassy": "${destinationCountry.name} Embassy/Consulate name in ${residenceCountry.name}",
    "address": "${destinationCountry.name} embassy address in ${residenceCountry.name}",
    "phone": "${destinationCountry.name} embassy contact phone",
    "email": "${destinationCountry.name} embassy contact email",
    "website": "EXACT ${destinationCountry.name} embassy website URL or null"
  },
  "application_form_url": "Official ${destinationCountry.name} visa form URL or null",
  "checklist_url": "Official ${destinationCountry.name} checklist URL or null",
  "visa_fee": "Fee in official currency from ${destinationCountry.name} sources",
  "processing_time": "Processing time from ${destinationCountry.name} official sources",
  "booking_link": "Official ${destinationCountry.name} booking URL or null"
}

FINAL REMINDER:
- Focus ONLY on ${destinationCountry.name} official sources
- Reject information from ${passportCountry.name} or ${residenceCountry.name} government sites
- All URLs must be from ${destinationCountry.name} authorities or their verified service providers
- Use null for any URL you cannot verify from official ${destinationCountry.name} sources

Return ONLY valid JSON, no markdown formatting, no code blocks.`;
  }
}

module.exports = PerplexityScraper;
 
