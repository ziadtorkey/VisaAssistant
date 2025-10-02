const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboard);

// Countries
router.get('/countries', getAllCountries);
router.post('/countries', createCountry);
router.delete('/countries/:id', deleteCountry);

// Visa Requirements
router.get('/visa-requirements', getAllVisaRequirements);
router.delete('/visa-requirements/:id', deleteVisaRequirement);

// Scraping
router.post('/scrape/:id', scrapeRequirement);
router.post('/scrape-all', scrapeAll);

// Logs
router.get('/logs', getLogs);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;