const express = require('express');
const { getCountries, getVisaRequirements, getScrapingStatus } = require('../controllers/visaController');

const router = express.Router();

router.get('/countries', getCountries);
router.get('/visa-requirements', getVisaRequirements);
router.get('/scraping-status/:requestId', getScrapingStatus);

module.exports = router;