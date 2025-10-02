const db = require('./src/config/database');

console.log('🔄 Generating all country combinations for visa requirements...\n');
console.log('This will create: passport_country × residence_country × destination_country\n');

// Get all countries first
db.all('SELECT id, code, name FROM countries WHERE is_active = 1', [], (err, countries) => {
  if (err) {
    console.error('❌ Error fetching countries:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`📊 Found ${countries.length} countries`);

  // Calculate total combinations
  const totalCombinations = countries.length * countries.length * countries.length;
  console.log(`📊 Total possible combinations: ${totalCombinations.toLocaleString()}`);
  console.log(`⚠️  This is a lot! Consider filtering (e.g., same passport & residence)\n`);

  // Ask for confirmation via command line argument
  const mode = process.argv[2];

  if (!mode) {
    console.log('Please choose a mode:');
    console.log('');
    console.log('  node bulkAddCombinations.js SAME_PASSPORT_RESIDENCE');
    console.log('    → Creates combinations where passport = residence');
    console.log('    → Total: ~100 × 100 = 10,000 combinations');
    console.log('');
    console.log('  node bulkAddCombinations.js ALL');
    console.log('    → Creates ALL possible combinations (passport × residence × destination)');
    console.log(`    → Total: ~${totalCombinations.toLocaleString()} combinations (WARNING: VERY LARGE!)`);
    console.log('');
    console.log('  node bulkAddCombinations.js TOP_DESTINATIONS');
    console.log('    → Creates combinations for top 20 destination countries only');
    console.log('    → Total: ~100 × 100 × 20 = 200,000 combinations');
    console.log('');
    db.close();
    process.exit(0);
  }

  let combinations = [];

  if (mode === 'SAME_PASSPORT_RESIDENCE') {
    console.log('📝 Mode: Same passport and residence country');
    console.log('   Creating combinations where passport_country = residence_country\n');

    countries.forEach(passport => {
      countries.forEach(destination => {
        if (passport.id !== destination.id) { // Don't create combinations to travel to own country
          combinations.push({
            passport_id: passport.id,
            residence_id: passport.id, // Same as passport
            destination_id: destination.id,
            description: `${passport.code} → ${destination.code}`
          });
        }
      });
    });
  }
  else if (mode === 'TOP_DESTINATIONS') {
    // Top 20 most visited countries
    const topDestinations = [
      'FR', 'ES', 'US', 'IT', 'TR', 'GB', 'DE', 'TH', 'JP', 'MX',
      'AT', 'GR', 'MY', 'PT', 'NL', 'AE', 'SG', 'CA', 'AU', 'CH'
    ];

    const destinationCountries = countries.filter(c => topDestinations.includes(c.code));

    console.log('📝 Mode: Top destination countries');
    console.log(`   Using ${destinationCountries.length} popular destinations\n`);

    countries.forEach(passport => {
      countries.forEach(residence => {
        destinationCountries.forEach(destination => {
          if (destination.id !== passport.id || destination.id !== residence.id) {
            combinations.push({
              passport_id: passport.id,
              residence_id: residence.id,
              destination_id: destination.id,
              description: `${passport.code}/${residence.code} → ${destination.code}`
            });
          }
        });
      });
    });
  }
  else if (mode === 'ALL') {
    console.log('📝 Mode: ALL combinations');
    console.log('   ⚠️  WARNING: This will create A LOT of combinations!\n');

    countries.forEach(passport => {
      countries.forEach(residence => {
        countries.forEach(destination => {
          combinations.push({
            passport_id: passport.id,
            residence_id: residence.id,
            destination_id: destination.id,
            description: `${passport.code}/${residence.code} → ${destination.code}`
          });
        });
      });
    });
  }
  else {
    console.error(`❌ Invalid mode: ${mode}`);
    console.log('Use: SAME_PASSPORT_RESIDENCE, TOP_DESTINATIONS, or ALL');
    db.close();
    process.exit(1);
  }

  console.log(`📊 Will create ${combinations.length.toLocaleString()} combinations\n`);
  console.log('Starting in 3 seconds... (Ctrl+C to cancel)');

  setTimeout(() => {
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
        `INSERT INTO visa_requirements
         (passport_country_id, residence_country_id, destination_country_id,
          visa_status, data_status)
         VALUES (?, ?, ?, NULL, 'unavailable')`,
        [combo.passport_id, combo.residence_id, combo.destination_id],
        function(err) {
          processed++;

          if (err) {
            if (err.message.includes('UNIQUE constraint')) {
              skipped++;
            } else {
              errors++;
            }
          } else {
            added++;
          }

          // Show progress every 100 combinations
          if (processed % 100 === 0) {
            const percent = ((processed / combinations.length) * 100).toFixed(1);
            process.stdout.write(`\rProgress: ${processed.toLocaleString()} / ${combinations.length.toLocaleString()} (${percent}%) - Added: ${added.toLocaleString()}, Skipped: ${skipped.toLocaleString()}`);
          }

          // Add next combination
          addCombination(index + 1);
        }
      );
    }

    addCombination(0);
  }, 3000);
});
