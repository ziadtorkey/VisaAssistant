const Country = require('../models/Country');
const VisaRequirement = require('../models/VisaRequirement');
const Setting = require('../models/Setting');
const { scrapeVisaRequirement } = require('../scrapers/scrapingManager');

// In-memory store for tracking scraping requests
const scrapingRequests = new Map();

function generateRequestId() {
  return `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const getCountries = async (req, res) => {
  try {
    const countries = await Country.getActive();
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
};

const getVisaRequirements = async (req, res) => {
  try {
    const { passport, residence, destination } = req.query;

    if (!passport || !residence || !destination) {
      return res.status(400).json({ error: 'All country parameters required' });
    }

    // Find countries by code
    const countries = await Country.getAll();
    const passportCountry = countries.find(c => c.code === passport);
    const residenceCountry = countries.find(c => c.code === residence);
    const destinationCountry = countries.find(c => c.code === destination);

    if (!passportCountry || !residenceCountry || !destinationCountry) {
      return res.status(404).json({ error: 'One or more countries not found' });
    }

    // Get visa requirements
    const requirement = await VisaRequirement.getByCountries(
      passportCountry.id,
      residenceCountry.id,
      destinationCountry.id
    );

    if (!requirement) {
      return res.json({
        available: false,
        message: 'Visa requirement information not available for this combination. Please check official embassy websites.'
      });
    }

    // Check data freshness
    const expiryDays = parseInt(await Setting.get('data_expiry_days') || '14');
    const lastUpdated = new Date(requirement.last_updated);
    const now = new Date();
    const daysDiff = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));

    // Check if data needs scraping (no visa_status means not scraped yet OR data is expired)
    const needsScraping = !requirement.visa_status || daysDiff > expiryDays;

    if (needsScraping) {
      // Generate unique request ID
      const requestId = generateRequestId();

      // Store request status
      scrapingRequests.set(requestId, {
        status: 'pending',
        requirementId: requirement.id,
        startedAt: new Date(),
        countries: {
          passport: passportCountry,
          residence: residenceCountry,
          destination: destinationCountry
        }
      });

      // Start scraping in background (don't await)
      scrapeVisaRequirement(passportCountry.id, residenceCountry.id, destinationCountry.id)
        .then((result) => {
          scrapingRequests.set(requestId, {
            ...scrapingRequests.get(requestId),
            status: 'completed',
            completedAt: new Date(),
            success: result.success,
            data: result.data,
            error: result.error
          });
        })
        .catch((error) => {
          scrapingRequests.set(requestId, {
            ...scrapingRequests.get(requestId),
            status: 'failed',
            completedAt: new Date(),
            error: error.message
          });
        });

      // Return scraping status
      return res.json({
        scraping: true,
        requestId,
        message: 'Gathering visa requirement information. Please wait...',
        countries: {
          passport: { name: passportCountry.name, code: passportCountry.code },
          residence: { name: residenceCountry.name, code: residenceCountry.code },
          destination: { name: destinationCountry.name, code: destinationCountry.code }
        }
      });
    }

    // Data is fresh, return it
    let dataStatus = 'fresh';
    let statusMessage = null;

    if (daysDiff > expiryDays) {
      dataStatus = 'stale';
      statusMessage = 'This data may be outdated. Please verify with official sources.';
    }

    // Parse JSON fields
    const response = {
      available: true,
      dataStatus,
      statusMessage,
      lastUpdated: requirement.last_updated,
      daysOld: daysDiff,
      visaStatus: requirement.visa_status,
      requiredDocuments: requirement.required_documents ? JSON.parse(requirement.required_documents) : [],
      applicationSteps: requirement.application_steps ? JSON.parse(requirement.application_steps) : [],
      applicationLocation: requirement.application_location,
      contactInfo: requirement.contact_info ? JSON.parse(requirement.contact_info) : {},
      applicationFormUrl: requirement.application_form_url,
      checklistUrl: requirement.checklist_url,
      visaFee: requirement.visa_fee,
      processingTime: requirement.processing_time,
      bookingLink: requirement.booking_link,
      sourceUrls: requirement.source_urls ? JSON.parse(requirement.source_urls) : [],
      countries: {
        passport: { name: requirement.passport_country, code: requirement.passport_code },
        residence: { name: requirement.residence_country, code: requirement.residence_code },
        destination: { name: requirement.destination_country, code: requirement.destination_code }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching visa requirements:', error);
    res.status(500).json({ error: 'Failed to fetch visa requirements' });
  }
};

const getScrapingStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = scrapingRequests.get(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // If completed, fetch the updated requirement data
    if (request.status === 'completed' && request.success) {
      const requirement = await VisaRequirement.getByCountries(
        request.countries.passport.id,
        request.countries.residence.id,
        request.countries.destination.id
      );

      if (requirement && requirement.visa_status) {
        // Parse JSON fields
        const response = {
          status: 'completed',
          available: true,
          dataStatus: 'fresh',
          lastUpdated: requirement.last_updated,
          daysOld: 0,
          visaStatus: requirement.visa_status,
          requiredDocuments: requirement.required_documents ? JSON.parse(requirement.required_documents) : [],
          applicationSteps: requirement.application_steps ? JSON.parse(requirement.application_steps) : [],
          applicationLocation: requirement.application_location,
          contactInfo: requirement.contact_info ? JSON.parse(requirement.contact_info) : {},
          applicationFormUrl: requirement.application_form_url,
          checklistUrl: requirement.checklist_url,
          visaFee: requirement.visa_fee,
          processingTime: requirement.processing_time,
          bookingLink: requirement.booking_link,
          sourceUrls: requirement.source_urls ? JSON.parse(requirement.source_urls) : [],
          countries: {
            passport: { name: requirement.passport_country, code: requirement.passport_code },
            residence: { name: requirement.residence_country, code: requirement.residence_code },
            destination: { name: requirement.destination_country, code: requirement.destination_code }
          }
        };

        return res.json(response);
      }
    }

    // Return current status
    res.json({
      status: request.status,
      message: request.status === 'pending' ? 'Gathering visa requirement information...' :
               request.status === 'failed' ? 'Failed to gather information' :
               'Processing...',
      error: request.error || null
    });

  } catch (error) {
    console.error('Error checking scraping status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
};

module.exports = { getCountries, getVisaRequirements, getScrapingStatus };