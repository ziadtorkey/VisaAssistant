# AI-Powered Visa Scraping Setup Guide

## Overview

Instead of traditional web scraping, you can use **Google's Gemini API** (or other AI APIs) to generate accurate visa requirement information. This approach is:

✅ **More Reliable** - No broken scrapers when websites change
✅ **Faster to Implement** - Works for ALL countries immediately
✅ **More Comprehensive** - AI can provide detailed, contextual information
✅ **Easier to Maintain** - No need to update scrapers per website

## How It Works

```
User Triggers Scraping
        ↓
Scraping Manager builds AI prompt
        ↓
Sends to Gemini API with structured prompt
        ↓
AI returns JSON with visa requirements
        ↓
Data saved to database
        ↓
Available to users instantly
```

## Setup Instructions

### Step 1: Get Google Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Click **"Get API Key"**
3. Create a new project or select existing one
4. Click **"Create API Key"**
5. Copy your API key

**Alternative AI APIs:**
- OpenAI GPT-4: https://platform.openai.com/api-keys
- Claude API: https://console.anthropic.com/
- Azure OpenAI: https://azure.microsoft.com/en-us/products/ai-services/openai-service

### Step 2: Add API Key to Environment

Edit `backend/.env`:

```env
# AI Scraping Configuration
GEMINI_API_KEY=AIzaSyB...your-actual-key-here
USE_AI_SCRAPER=true
```

### Step 3: Restart Backend Server

The server will automatically reload with the new configuration.

```bash
cd backend
npm run dev
```

## Usage Options

### Option 1: Use AI for ALL Countries (Recommended)

Set in `.env`:
```env
USE_AI_SCRAPER=true
```

This will use AI scraping for **every country combination**, including Switzerland and Germany.

### Option 2: Use AI as Fallback Only

Set in `.env`:
```env
USE_AI_SCRAPER=false
```

This will:
- Use traditional scrapers for Switzerland (CH) and Germany (DE)
- Use AI scraper for **all other countries** (Saudi Arabia, Egypt, etc.)

### Option 3: Country-Specific AI Scrapers

You can create country-specific AI scrapers with customized prompts:

```javascript
// backend/src/scrapers/egyptAIScraper.js
const AIScraper = require('./aiScraper');

class EgyptAIScraper extends AIScraper {
  buildPrompt(passportCountry, residenceCountry, destinationCountry) {
    // Custom prompt for Egypt with specific requirements
    return `Provide visa requirements for traveling to Egypt...`;
  }
}
```

Then add to `scrapingManager.js`:
```javascript
const scraperMap = {
  'CH': SwitzerlandScraper,
  'DE': GermanyScraper,
  'EG': EgyptAIScraper  // Custom AI scraper
};
```

## Testing AI Scraping

1. **Via Admin Panel:**
   - Login: http://localhost:5174/admin
   - Go to "Data Management"
   - Click "Re-scrape" on any country combination
   - Check "Logs" tab to see AI scraping results

2. **Via API:**
   ```bash
   # Login to get token
   curl -X POST http://localhost:5000/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'

   # Trigger scraping (use your token)
   curl -X POST http://localhost:5000/api/admin/scrape/1 \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

3. **Check Results:**
   ```bash
   # View visa requirements
   curl "http://localhost:5000/api/visa-requirements?passport=EG&residence=EG&destination=SA"
   ```

## Prompt Engineering

The AI scraper uses a carefully crafted prompt to ensure:

1. **Structured Output** - Returns JSON format
2. **Accuracy** - Low temperature (0.1) for factual responses
3. **Completeness** - Requests 8-12 documents, 6-10 steps
4. **Specificity** - Includes country-specific details
5. **Source Attribution** - Timestamps AI-generated data

### Customizing the Prompt

Edit `backend/src/scrapers/aiScraper.js`:

```javascript
buildPrompt(passportCountry, residenceCountry, destinationCountry) {
  return `Your custom prompt here...

  Include specific requirements for your use case:
  - Focus on certain visa types
  - Request additional fields
  - Add specific formatting requirements
  `;
}
```

## Cost Considerations

### Google Gemini API Pricing (as of 2024):

**Gemini Pro:**
- Input: $0.00025 / 1K characters (~$0.50 per 1M characters)
- Output: $0.0005 / 1K characters (~$1.00 per 1M characters)

**Estimated Cost per Visa Query:**
- Input: ~1,000 characters = $0.00025
- Output: ~2,000 characters = $0.001
- **Total per query: ~$0.00125** (less than a cent!)

**For 1,000 visa queries:**
- Cost: ~$1.25

**Free Tier:**
- 60 requests per minute
- Perfect for MVP and testing

### Comparison with Web Scraping Costs:
- Web Scraping: Server costs, maintenance time, broken scrapers
- AI Scraping: Pay-per-use, zero maintenance, always works

## Advantages Over Traditional Scraping

| Feature | Web Scraping | AI Scraping |
|---------|-------------|-------------|
| **Setup Time** | Hours per country | Minutes for all |
| **Maintenance** | Constant updates | Zero |
| **Coverage** | Limited countries | All countries |
| **Accuracy** | Depends on website | Generally high |
| **Speed** | Fast but fragile | Fast and reliable |
| **Cost** | Server + dev time | API costs only |
| **Scalability** | Limited | Unlimited |

## Hybrid Approach (Best of Both Worlds)

Use both traditional and AI scraping:

1. **Primary**: AI scraping for all countries
2. **Validation**: Web scraping for critical countries
3. **Comparison**: Compare both sources for accuracy
4. **Fallback**: Use web scraping if AI is unavailable

```javascript
// Example hybrid approach
if (aiScrapingResult.success && webScrapingResult.success) {
  // Compare and merge results
  const mergedData = compareAndMerge(aiScrapingResult, webScrapingResult);
  return mergedData;
} else if (aiScrapingResult.success) {
  return aiScrapingResult;
} else {
  return webScrapingResult;
}
```

## Troubleshooting

### API Key Not Working
```
Error: API key not valid
```
**Solution:**
- Verify key is correct in `.env`
- Check API key is enabled at https://makersuite.google.com/
- Ensure billing is set up (if required)

### JSON Parse Error
```
Error: Unexpected token in JSON
```
**Solution:**
- AI returned non-JSON text
- Increase temperature to 0.1 for more consistent formatting
- Add stricter prompt instructions

### Rate Limiting
```
Error: 429 Too Many Requests
```
**Solution:**
- Implement delay between requests
- Upgrade to paid tier
- Use multiple API keys with rotation

## Best Practices

1. **Cache Aggressively** - Store AI results in database
2. **Set Data Expiry** - Default 14 days is good for visa data
3. **Monitor Costs** - Track API usage in Google Cloud Console
4. **Validate Responses** - Check JSON structure before saving
5. **Log Everything** - Keep track of AI-generated content
6. **Provide Attribution** - Show users data is AI-generated
7. **Human Review** - Periodically verify accuracy

## Future Enhancements

1. **Multi-Source Validation**
   - Query multiple AI models
   - Compare results
   - Use consensus for accuracy

2. **Real-Time Updates**
   - AI checks official sources
   - Detects policy changes
   - Auto-updates database

3. **Conversational Interface**
   - Users chat with AI
   - Ask specific questions
   - Get personalized advice

4. **Document OCR**
   - AI reads embassy PDFs
   - Extracts requirements
   - Updates database automatically

## Support

For issues or questions:
- Google Gemini API Docs: https://ai.google.dev/docs
- Project Issues: https://github.com/your-repo/issues

---

**Ready to use AI scraping!** 🚀

Set your API key and start scraping all countries instantly.