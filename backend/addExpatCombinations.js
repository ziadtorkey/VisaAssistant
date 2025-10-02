const db = require('./src/config/database');

// Add combinations for expats - people living in a different country than their passport
// This covers the most common real-world scenarios:
// - Expats in major destination countries (UAE, USA, UK, Germany, etc.)
// - Cross-border workers in neighboring countries
// - Students studying abroad

console.log('🌍 Adding expat combinations (passport ≠ residence)...\n');

// Major expat destination countries (where people commonly live/work)
const expatDestinations = [
  'AE', // UAE (Dubai, Abu Dhabi) - huge expat population
  'US', // United States
  'GB', // United Kingdom
  'DE', // Germany
  'FR', // France
  'CA', // Canada
  'AU', // Australia
  'CH', // Switzerland
  'SG', // Singapore
  'HK', // Hong Kong
  'QA', // Qatar
  'SA', // Saudi Arabia
  'NL', // Netherlands
  'BE', // Belgium
  'ES', // Spain
  'IT', // Italy
  'SE', // Sweden
  'NO', // Norway
  'JP', // Japan
  'KR'  // South Korea
];

console.log(`📊 Creating combinations for expats living in ${expatDestinations.length} major destination countries\n`);

db.all('SELECT id, code, name FROM countries WHERE is_active = 1', [], (err, countries) => {
  if (err) {
    console.error('❌ Error fetching countries:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`📊 Found ${countries.length} countries total`);

  const expatCountries = countries.filter(c => expatDestinations.includes(c.code));
  console.log(`📊 ${expatCountries.length} expat destination countries`);

  // Calculate total combinations
  // For each passport country × each expat destination (where passport ≠ residence) × all destinations
  let estimatedCombinations = 0;
  countries.forEach(passport => {
    expatCountries.forEach(residence => {
      if (passport.code !== residence.code) {
        estimatedCombinations += countries.length; // to all destinations
      }
    });
  });

  console.log(`📊 Estimated combinations: ${estimatedCombinations.toLocaleString()}\n`);
  console.log('Starting in 3 seconds... (Ctrl+C to cancel)');

  setTimeout(() => {
    let combinations = [];

    // Create combinations for expats
    countries.forEach(passport => {
      expatCountries.forEach(residence => {
        // Only add if passport country ≠ residence country (expat scenario)
        if (passport.code !== residence.code) {
          countries.forEach(destination => {
            combinations.push({
              passport_id: passport.id,
              residence_id: residence.id,
              destination_id: destination.id,
              description: `${passport.code} passport living in ${residence.code} → ${destination.code}`
            });
          });
        }
      });
    });

    console.log(`\n📊 Created ${combinations.length.toLocaleString()} expat combinations`);
    console.log('Starting database insert...\n');

    let added = 0;
    let skipped = 0;
    let errors = 0;
    let processed = 0;

    function addCombination(index) {
      if (index >= combinations.length) {
        console.log(`\n\n✅ Complete!`);
        console.log(`   Added: ${added.toLocaleString()}`);
        console.log(`   Skipped (already exists): ${skipped.toLocaleString()}`);
        console.log(`   Errors: ${errors.toLocaleString()}\n`);

        db.get('SELECT COUNT(*) as count FROM visa_requirements', [], (err, result) => {
          if (!err) {
            console.log(`📊 Total visa requirements in database: ${result.count.toLocaleString()}\n`);
          }
          db.close();
        });
        return;
      }

      const combo = combinations[index];

      db.run(
        `INSERT OR IGNORE INTO visa_requirements
         (passport_country_id, residence_country_id, destination_country_id,
          visa_status, data_status)
         VALUES (?, ?, ?, NULL, 'unavailable')`,
        [combo.passport_id, combo.residence_id, combo.destination_id],
        function(err) {
          processed++;

          if (err) {
            errors++;
          } else if (this.changes === 0) {
            skipped++;
          } else {
            added++;
          }

          // Show progress every 500 combinations
          if (processed % 500 === 0) {
            const percent = ((processed / combinations.length) * 100).toFixed(1);
            process.stdout.write(`\rProgress: ${processed.toLocaleString()} / ${combinations.length.toLocaleString()} (${percent}%) - Added: ${added.toLocaleString()}`);
          }

          // Add next combination
          setImmediate(() => addCombination(index + 1));
        }
      );
    }

    addCombination(0);
  }, 3000);
});
