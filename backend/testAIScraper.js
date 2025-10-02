const db = require('./src/config/database');

// Add Switzerland -> Egypt entry (Egypt has no scraper, so AI will be used)
db.run(`
  INSERT OR IGNORE INTO visa_requirements (
    passport_country_id, residence_country_id, destination_country_id,
    visa_status, data_status
  ) VALUES (1, 1, 4, NULL, 'unavailable')
`, (err) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('✅ Added Switzerland -> Egypt test entry');

    // Get the ID
    db.get(`
      SELECT id FROM visa_requirements
      WHERE passport_country_id = 1
      AND residence_country_id = 1
      AND destination_country_id = 4
    `, (err, row) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log(`\n📝 To test AI scraping, run:`);
        console.log(`curl -X POST http://localhost:5000/api/admin/scrape/${row.id} -H "Authorization: Bearer YOUR_TOKEN"\n`);
        console.log(`This will scrape for Switzerland -> Egypt`);
        console.log(`Egypt has NO custom scraper, so it MUST use the AI scraper!\n`);
      }
      db.close();
    });
  }
});
