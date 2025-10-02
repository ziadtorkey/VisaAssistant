const db = require('./src/config/database');

// This creates ALL passport × residence combinations (any passport with any residence)
// to ALL destinations
// This is the most flexible option for users who may be expats living abroad

console.log('🔄 Creating ALL passport × residence combinations to all destinations...\n');
console.log('⚠️  This will create ~1 million combinations and take 10-20 minutes!\n');

// Get all countries first
db.all('SELECT id, code, name FROM countries WHERE is_active = 1', [], (err, countries) => {
  if (err) {
    console.error('❌ Error fetching countries:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`📊 Found ${countries.length} countries`);

  const totalCombinations = countries.length * countries.length * countries.length;
  console.log(`📊 Total combinations: ${totalCombinations.toLocaleString()}\n`);

  console.log('Starting in 5 seconds... (Ctrl+C to cancel)');

  setTimeout(() => {
    let combinations = [];

    countries.forEach(passport => {
      countries.forEach(residence => {
        countries.forEach(destination => {
          combinations.push({
            passport_id: passport.id,
            residence_id: residence.id,
            destination_id: destination.id
          });
        });
      });
    });

    console.log(`\n📊 Created ${combinations.length.toLocaleString()} combinations`);
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

          // Show progress every 1000 combinations
          if (processed % 1000 === 0) {
            const percent = ((processed / combinations.length) * 100).toFixed(1);
            process.stdout.write(`\rProgress: ${processed.toLocaleString()} / ${combinations.length.toLocaleString()} (${percent}%) - Added: ${added.toLocaleString()}`);
          }

          // Add next combination
          setImmediate(() => addCombination(index + 1));
        }
      );
    }

    addCombination(0);
  }, 5000);
});
