const axios = require('axios');
const cheerio = require('cheerio');

class BaseScraper {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      delayMs: config.delayMs || 2000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  async fetchPage(url) {
    let lastError;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        await this.delay(this.config.delayMs);

        const response = await axios.get(url, {
          timeout: this.config.timeout,
          headers: {
            'User-Agent': this.config.userAgent
          }
        });

        return response.data;
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed for ${url}:`, error.message);

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.delayMs * attempt);
        }
      }
    }

    throw lastError;
  }

  parseHTML(html) {
    return cheerio.load(html);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  extractText($, selector) {
    const element = $(selector);
    return element.length ? element.text().trim() : null;
  }

  extractList($, selector) {
    const items = [];
    $(selector).each((i, el) => {
      const text = $(el).text().trim();
      if (text) items.push(text);
    });
    return items;
  }

  extractLink($, selector, baseUrl) {
    const element = $(selector);
    if (!element.length) return null;

    let href = element.attr('href');
    if (!href) return null;

    // Convert relative URLs to absolute
    if (href.startsWith('/')) {
      const url = new URL(baseUrl);
      href = `${url.origin}${href}`;
    } else if (!href.startsWith('http')) {
      href = `${baseUrl}/${href}`;
    }

    return href;
  }

  cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  // To be implemented by specific scrapers
  async scrape(passportCountry, residenceCountry, destinationCountry) {
    throw new Error('scrape() must be implemented by subclass');
  }
}

module.exports = BaseScraper;