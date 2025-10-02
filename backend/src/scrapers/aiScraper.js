const axios = require('axios');

class AIScraper {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    // Use v1 API with gemini-pro model
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
  }

  async scrape(passportCountry, residenceCountry, destinationCountry) {
    try {
      console.log(`[AI] Getting visa data for ${passportCountry.name} -> ${destinationCountry.name} using Gemini API`);

      const prompt = this.buildPrompt(passportCountry, residenceCountry, destinationCountry);

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1, // Low temperature for factual responses
            maxOutputTokens: 2048
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // Extract the response text
      const aiResponse = response.data.candidates[0].content.parts[0].text;

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
          source_urls: JSON.stringify([`AI Generated - ${new Date().toISOString()}`])
        }
      };

    } catch (error) {
      console.error('AI Scraping error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  buildPrompt(passportCountry, residenceCountry, destinationCountry) {
    return `You are a visa requirements expert. Provide accurate, up-to-date visa requirement information for travelers.

IMPORTANT: Respond ONLY with valid JSON, no additional text.

Query Details:
- Passport Country: ${passportCountry.name} (${passportCountry.code})
- Current Residence: ${residenceCountry.name} (${residenceCountry.code})
- Destination Country: ${destinationCountry.name} (${destinationCountry.code})
- Visa Type: Tourist/Short Stay

Please provide comprehensive visa requirement information in the following JSON format:

{
  "visa_status": "required|not_required|visa_on_arrival|evisa",
  "required_documents": [
    "List of required documents with specific details"
  ],
  "application_steps": [
    "Step-by-step application process in order"
  ],
  "application_location": "Where to apply (embassy name, VFS center, etc)",
  "contact_info": {
    "embassy": "Embassy name",
    "address": "Embassy address in ${residenceCountry.name}",
    "phone": "Contact phone number",
    "email": "Contact email",
    "website": "Official embassy website URL"
  },
  "application_form_url": "URL to visa application form (if available)",
  "checklist_url": "URL to document checklist (if available)",
  "visa_fee": "Fee amount with currency",
  "processing_time": "Estimated processing time",
  "booking_link": "URL to book appointment (if available)"
}

Requirements:
1. Be specific and accurate with all information
2. Include realistic fees and processing times
3. Provide actual embassy contact details for ${destinationCountry.name} in ${residenceCountry.name}
4. List 8-12 specific required documents
5. Provide 6-10 detailed application steps
6. If information is not available or uncertain, use "Contact local embassy" or null
7. Return ONLY valid JSON, no markdown formatting or additional text`;
  }
}

module.exports = AIScraper;