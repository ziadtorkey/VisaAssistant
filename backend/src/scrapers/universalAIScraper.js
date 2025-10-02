const AIScraper = require('./aiScraper');

class UniversalAIScraper extends AIScraper {
  constructor(config) {
    super(config);
    // This scraper can handle ANY country combination
    console.log('[Universal AI Scraper] Initialized');
  }

  async scrape(passportCountry, residenceCountry, destinationCountry) {
    console.log(`[Universal AI] Processing: ${passportCountry.name} → ${destinationCountry.name}`);

    // Use the parent AI scraper logic
    return super.scrape(passportCountry, residenceCountry, destinationCountry);
  }
}

module.exports = UniversalAIScraper;