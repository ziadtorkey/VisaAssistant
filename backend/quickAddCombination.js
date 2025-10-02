const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Quick add using a separate database connection
// Works even when bulk import is running

const passportCode = process.argv[2];
const residenceCode = process.argv[3];
const destinationCode = process.argv[4];

if (!passportCode || !residenceCode || !destinationCode) {
  console.error('Usage: node quickAddCombination.js PASSPORT_CODE RESIDENCE_CODE DESTINATION_CODE');
  console.error('Example: node quickAddCombination.js TH BE UA');
  process.exit(1);
}

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
});

// Use immediate mode to bypass locks
db.serialize(() => {
  // Get country IDs
  db.get('SELECT id, name FROM countries WHERE code = ?', [passportCode], (err, passport) => {
    if (err || !passport) {
      console.error(`❌ Passport country "${passportCode}" not found`);
      db.close();
      process.exit(1);
    }

    db.get('SELECT id, name FROM countries WHERE code = ?', [residenceCode], (err, residence) => {
      if (err || !residence) {
        console.error(`❌ Residence country "${residenceCode}" not found`);
        db.close();
        process.exit(1);
      }

      db.get('SELECT id, name FROM countries WHERE code = ?', [destinationCode], (err, destination) => {
        if (err || !destination) {
          console.error(`❌ Destination country "${destinationCode}" not found`);
          db.close();
          process.exit(1);
        }

        // Insert using OR IGNORE to avoid conflicts
        db.run(
          `INSERT OR IGNORE INTO visa_requirements
           (passport_country_id, residence_country_id, destination_country_id,
            visa_status, data_status)
           VALUES (?, ?, ?, NULL, 'unavailable')`,
          [passport.id, residence.id, destination.id],
          function(err) {
            if (err) {
              console.error('❌ Error:', err.message);
              db.close();
              process.exit(1);
            }

            if (this.changes === 0) {
              console.log(`⚠️  Combination already exists`);
              console.log(`   ${passport.name} (${passportCode}) / ${residence.name} (${residenceCode}) → ${destination.name} (${destinationCode})`);
            } else {
              console.log(`✅ Added combination with ID: ${this.lastID}`);
              console.log(`   ${passport.name} (${passportCode}) / ${residence.name} (${residenceCode}) → ${destination.name} (${destinationCode})`);
            }

            db.close();
          }
        );
      });
    });
  });
});
