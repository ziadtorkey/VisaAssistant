const db = require('./database');

// Create test visa requirement entries for scraping
const seedTestData = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create a test visa requirement for Egypt -> Switzerland
      db.run(`
        INSERT OR IGNORE INTO visa_requirements (
          passport_country_id, residence_country_id, destination_country_id,
          visa_status, required_documents, application_steps,
          application_location, contact_info, application_form_url,
          checklist_url, visa_fee, processing_time, booking_link,
          source_urls, last_updated, data_status
        ) VALUES (4, 4, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'unavailable')
      `, (err) => {
        if (err) {
          console.error('Error creating Egypt -> Switzerland entry:', err);
        } else {
          console.log('✓ Created Egypt (passport) -> Switzerland (destination) requirement');
        }
      });

      // Create a test visa requirement for Egypt -> Germany
      db.run(`
        INSERT OR IGNORE INTO visa_requirements (
          passport_country_id, residence_country_id, destination_country_id,
          visa_status, required_documents, application_steps,
          application_location, contact_info, application_form_url,
          checklist_url, visa_fee, processing_time, booking_link,
          source_urls, last_updated, data_status
        ) VALUES (4, 4, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'unavailable')
      `, (err) => {
        if (err) {
          console.error('Error creating Egypt -> Germany entry:', err);
        } else {
          console.log('✓ Created Egypt (passport) -> Germany (destination) requirement');
        }
      });

      // Create a test visa requirement for Saudi Arabia -> Switzerland
      db.run(`
        INSERT OR IGNORE INTO visa_requirements (
          passport_country_id, residence_country_id, destination_country_id,
          visa_status, required_documents, application_steps,
          application_location, contact_info, application_form_url,
          checklist_url, visa_fee, processing_time, booking_link,
          source_urls, last_updated, data_status
        ) VALUES (3, 3, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'unavailable')
      `, (err) => {
        if (err) {
          console.error('Error creating Saudi Arabia -> Switzerland entry:', err);
        } else {
          console.log('✓ Created Saudi Arabia (passport) -> Switzerland (destination) requirement');
        }
      });

      // Create a test visa requirement for Germany -> Switzerland
      db.run(`
        INSERT OR IGNORE INTO visa_requirements (
          passport_country_id, residence_country_id, destination_country_id,
          visa_status, required_documents, application_steps,
          application_location, contact_info, application_form_url,
          checklist_url, visa_fee, processing_time, booking_link,
          source_urls, last_updated, data_status
        ) VALUES (2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'unavailable')
      `, (err) => {
        if (err) {
          console.error('Error creating Germany -> Switzerland entry:', err);
        } else {
          console.log('✓ Created Germany (passport) -> Switzerland (destination) requirement');
          console.log('\nTest data seeded! You can now test scraping in the admin panel.');
        }
        resolve();
      });
    });
  });
};

// Run if called directly
if (require.main === module) {
  seedTestData().then(() => {
    db.close();
    process.exit(0);
  });
}

module.exports = { seedTestData };