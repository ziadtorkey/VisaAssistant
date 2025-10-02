const axios = require('axios');

class OpenAIScraper {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = config.model || 'gpt-4o-mini'; // Using GPT-4o-mini for better accuracy
  }

  async scrape(passportCountry, residenceCountry, destinationCountry) {
    try {
      console.log(`[OpenAI] Getting visa data for ${passportCountry.name} -> ${destinationCountry.name} using ${this.model}`);

      const prompt = this.buildPrompt(passportCountry, residenceCountry, destinationCountry);

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a visa requirements expert. Provide accurate, up-to-date visa requirement information in JSON format only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for factual responses
          max_tokens: 2000,
          response_format: { type: 'json_object' } // Force JSON response
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000
        }
      );

      // Extract the response text
      const aiResponse = response.data.choices[0].message.content;

      // Parse the JSON response
      const visaData = JSON.parse(aiResponse);

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
          source_urls: JSON.stringify([`AI Generated (OpenAI ${this.model}) - ${new Date().toISOString()}`])
        }
      };

    } catch (error) {
      console.error('OpenAI Scraping error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  buildPrompt(passportCountry, residenceCountry, destinationCountry) {
    return `Provide comprehensive visa requirement information for the following travel scenario:

- Passport Country: ${passportCountry.name} (${passportCountry.code})
- Current Residence: ${residenceCountry.name} (${residenceCountry.code})
- Destination Country: ${destinationCountry.name} (${destinationCountry.code})
- Visa Type: Tourist/Short Stay

Return your response in the following JSON format:

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
  "application_location": "Where to apply (IMPORTANT: mention VFS Global or official visa application center if applicable, DO NOT say embassy if applications are processed through VFS)",
  "contact_info": {
    "embassy": "Embassy name",
    "address": "Embassy address in ${residenceCountry.name}",
    "phone": "Contact phone number",
    "email": "Contact email",
    "website": "Official embassy website URL"
  },
  "application_form_url": "Full URL to official visa application form (e.g. VFS Global, embassy website) or null if not available",
  "checklist_url": "Full URL to official document checklist or null if not available",
  "visa_fee": "Fee amount with currency",
  "processing_time": "Estimated processing time",
  "booking_link": "Full URL to book appointment (e.g. VFS Global booking) or null if not available"
}

Requirements:
1. Be specific and accurate with all information based on 2024/2025 requirements
2. Include realistic fees and processing times based on current 2024/2025 rates
3. Provide actual embassy contact details for ${destinationCountry.name} in ${residenceCountry.name}
4. List 8-12 specific required documents
5. Provide 6-10 detailed application steps, including biometrics appointment if applicable
6. If information is not available or uncertain, use "Contact local embassy" for strings or null for URLs
7. IMPORTANT: For application_location, check if the country uses VFS Global, TLScontact, or other official visa application centers in ${residenceCountry.name}
8. Return ONLY valid JSON, no markdown formatting`;
  }
}

module.exports = OpenAIScraper;