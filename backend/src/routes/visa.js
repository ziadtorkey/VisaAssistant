const express = require('express');
const { getCountries, getVisaRequirements, getScrapingStatus, submitFeedback } = require('../controllers/visaController');

const router = express.Router();

router.get('/countries', getCountries);
router.get('/visa-requirements', getVisaRequirements);
router.get('/scraping-status/:requestId', getScrapingStatus);
router.post('/feedback', submitFeedback);

module.exports = router;