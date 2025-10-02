const Country = require('../models/Country');
const VisaRequirement = require('../models/VisaRequirement');
const ScrapingLog = require('../models/ScrapingLog');
const Setting = require('../models/Setting');
const SwitzerlandScraper = require('./switzerlandScraper');
const GermanyScraper = require('./germanyScraper');
const UniversalAIScraper = require('./universalAIScraper');
const OpenAIScraper = require('./openaiScraper');
const PerplexityScraper = require('./perplexityScraper');

// Map country codes to scraper classes
const scraperMap = {
  'CH': SwitzerlandScraper,
  'DE': GermanyScraper,
  // Add more scrapers as they are implemented
};

// Universal AI scraper as fallback
const useAIForAllCountries = process.env.USE_AI_SCRAPER === 'true';

async function scrapeVisaRequirement(passportCountryId, residenceCountryId, destinationCountryId) {
  let requirementId = null;

  try {
    // Get country details
    const passportCountry = await Country.getById(passportCountryId);
    const residenceCountry = await Country.getById(residenceCountryId);
    const destinationCountry = await Country.getById(destinationCountryId);

    if (!passportCountry || !residenceCountry || !destinationCountry) {
      throw new Error('One or more countries not found');
    }

    console.log(`Scraping: ${passportCountry.name} -> ${destinationCountry.name} (Residence: ${residenceCountry.name})`);

    // Determine which scraper to use
    let ScraperClass;

    if (useAIForAllCountries) {
      // Check which AI scraper to use (Perplexity or OpenAI)
      const aiScraperPreference = process.env.AI_SCRAPER || 'openai';
      const hasPerplexityKey = process.env.PERPLEXITY_API_KEY && process.env.PERPLEXITY_API_KEY !== 'your-perplexity-api-key-here';

      console.log(`[Debug] AI_SCRAPER preference: ${aiScraperPreference}, Has Perplexity Key: ${hasPerplexityKey}`);

      if (aiScraperPreference === 'perplexity' && hasPerplexityKey) {
        console.log('[AI Mode] Using Perplexity Scraper with web search');
        ScraperClass = PerplexityScraper;
      } else {
        console.log('[AI Mode] Using OpenAI Scraper');
        ScraperClass = OpenAIScraper;
      }
    } else {
      // Check if specific scraper exists for destination country
      ScraperClass = scraperMap[destinationCountry.code];

      if (!ScraperClass) {
        // Fallback to AI scraper based on preference
        const aiScraperPreference = process.env.AI_SCRAPER || 'openai';

        if (aiScraperPreference === 'perplexity' && process.env.PERPLEXITY_API_KEY && process.env.PERPLEXITY_API_KEY !== 'your-perplexity-api-key-here') {
          console.log(`[Fallback] No specific scraper for ${destinationCountry.name}, using Perplexity scraper with web search`);
          ScraperClass = PerplexityScraper;
        } else {
          console.log(`[Fallback] No specific scraper for ${destinationCountry.name}, using OpenAI scraper`);
          ScraperClass = OpenAIScraper;
        }
      }
    }

    // Get scraping configuration from settings
    const retryAttempts = parseInt(await Setting.get('scraping_retry_attempts') || '3');
    const delayMs = parseInt(await Setting.get('scraping_delay_ms') || '2000');

    // Select the correct API key based on the scraper being used
    let apiKey;
    if (ScraperClass === PerplexityScraper) {
      apiKey = process.env.PERPLEXITY_API_KEY;
    } else {
      apiKey = process.env.OPENAI_API_KEY;
    }

    // Initialize scraper
    const scraper = new ScraperClass({
      retryAttempts,
      delayMs,
      apiKey
    });

    // Perform scraping
    const result = await scraper.scrape(
      passportCountry,
      residenceCountry,
      destinationCountry
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    // Check if requirement already exists
    const existing = await VisaRequirement.getByCountries(
      passportCountryId,
      residenceCountryId,
      destinationCountryId
    );

    const requirementData = {
      ...result.data,
      passport_country_id: passportCountryId,
      residence_country_id: residenceCountryId,
      destination_country_id: destinationCountryId,
      last_updated: new Date().toISOString(),
      data_status: 'fresh'
    };

    if (existing) {
      // Update existing requirement
      await VisaRequirement.update(existing.id, requirementData);
      requirementId = existing.id;
      console.log(`Updated visa requirement ID: ${requirementId}`);
    } else {
      // Create new requirement
      const created = await VisaRequirement.create(requirementData);
      requirementId = created.id;
      console.log(`Created visa requirement ID: ${requirementId}`);
    }

    // Log success
    await ScrapingLog.create({
      visa_requirement_id: requirementId,
      status: 'success',
      error_message: null,
      scraped_urls: result.data.source_urls
    });

    return {
      success: true,
      requirementId
    };

  } catch (error) {
    console.error('Scraping error:', error);

    // Try to get requirement ID if update failed
    if (!requirementId) {
      const existing = await VisaRequirement.getByCountries(
        passportCountryId,
        residenceCountryId,
        destinationCountryId
      );
      if (existing) requirementId = existing.id;
    }

    // Log failure
    if (requirementId) {
      await ScrapingLog.create({
        visa_requirement_id: requirementId,
        status: 'failure',
        error_message: error.message,
        scraped_urls: null
      });
    }

    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  scrapeVisaRequirement
};