const Country = require('../models/Country');
const VisaRequirement = require('../models/VisaRequirement');
const ScrapingLog = require('../models/ScrapingLog');
const Setting = require('../models/Setting');
const { scrapeVisaRequirement } = require('../scrapers/scrapingManager');

// Dashboard
const getDashboard = async (req, res) => {
  try {
    const stats = await VisaRequirement.getStats();
    const recentFailures = await ScrapingLog.getRecentFailures(5);
    const recentLogs = await ScrapingLog.getAll(10);

    res.json({
      stats: {
        totalCombinations: stats.total_combinations || 0,
        freshData: stats.fresh_count || 0,
        staleData: stats.stale_count || 0,
        unavailableData: stats.unavailable_count || 0,
        oldestUpdate: stats.oldest_update,
        newestUpdate: stats.newest_update
      },
      recentFailures,
      recentLogs
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// Countries Management
const getAllCountries = async (req, res) => {
  try {
    const countries = await Country.getAll();
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
};

const createCountry = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code required' });
    }

    const country = await Country.create(name, code.toUpperCase());
    res.status(201).json(country);
  } catch (error) {
    console.error('Error creating country:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Country code already exists' });
    }
    res.status(500).json({ error: 'Failed to create country' });
  }
};

const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Country.delete(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json({ message: 'Country deleted successfully' });
  } catch (error) {
    console.error('Error deleting country:', error);
    res.status(500).json({ error: 'Failed to delete country' });
  }
};

// Visa Requirements Management with Pagination and Filters
const getAllVisaRequirements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      passportCountryId,
      residenceCountryId,
      destinationCountryId,
      dataStatus
    } = req.query;

    const offset = (page - 1) * limit;

    const result = await VisaRequirement.getAllPaginated({
      limit: parseInt(limit),
      offset: parseInt(offset),
      passportCountryId,
      residenceCountryId,
      destinationCountryId,
      dataStatus
    });

    // Parse JSON fields for each requirement
    const parsed = result.data.map(req => ({
      ...req,
      required_documents: req.required_documents ? JSON.parse(req.required_documents) : [],
      application_steps: req.application_steps ? JSON.parse(req.application_steps) : [],
      contact_info: req.contact_info ? JSON.parse(req.contact_info) : {},
      source_urls: req.source_urls ? JSON.parse(req.source_urls) : []
    }));

    res.json({
      data: parsed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching visa requirements:', error);
    res.status(500).json({ error: 'Failed to fetch visa requirements' });
  }
};

const deleteVisaRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await VisaRequirement.delete(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Visa requirement not found' });
    }

    res.json({ message: 'Visa requirement deleted successfully' });
  } catch (error) {
    console.error('Error deleting visa requirement:', error);
    res.status(500).json({ error: 'Failed to delete visa requirement' });
  }
};

// Scraping
const scrapeRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // Check if force rescrape is requested

    const requirement = await VisaRequirement.getById(id);
    if (!requirement) {
      return res.status(404).json({ error: 'Visa requirement not found' });
    }

    // If force rescrape, clear existing data first
    if (force === 'true') {
      console.log(`[Rescrape] Clearing existing data for requirement ID: ${id}`);
      await VisaRequirement.clearScrapedData(id);
    }

    // Start scraping in background
    res.json({ message: force === 'true' ? 'Rescraping started' : 'Scraping started', requirementId: id });

    // Perform scraping asynchronously
    scrapeVisaRequirement(
      requirement.passport_country_id,
      requirement.residence_country_id,
      requirement.destination_country_id
    );
  } catch (error) {
    console.error('Error starting scrape:', error);
    res.status(500).json({ error: 'Failed to start scraping' });
  }
};

const scrapeAll = async (req, res) => {
  try {
    const requirements = await VisaRequirement.getAll();

    res.json({
      message: 'Bulk scraping started',
      count: requirements.length
    });

    // Perform scraping asynchronously for each requirement
    for (const req of requirements) {
      setTimeout(() => {
        scrapeVisaRequirement(
          req.passport_country_id,
          req.residence_country_id,
          req.destination_country_id
        );
      }, Math.random() * 5000); // Random delay to avoid overwhelming servers
    }
  } catch (error) {
    console.error('Error starting bulk scrape:', error);
    res.status(500).json({ error: 'Failed to start bulk scraping' });
  }
};

// Logs
const getLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await ScrapingLog.getAll(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// Settings
const getSettings = async (req, res) => {
  try {
    const settings = await Setting.getAll();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    await Setting.updateMultiple(settings);
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = {
  getDashboard,
  getAllCountries,
  createCountry,
  deleteCountry,
  getAllVisaRequirements,
  deleteVisaRequirement,
  scrapeRequirement,
  scrapeAll,
  getLogs,
  getSettings,
  updateSettings
};