const db = require('./src/config/database');

// Add a visa requirement combination
// Usage: node addVisaRequirement.js PASSPORT_CODE RESIDENCE_CODE DESTINATION_CODE
// Example: node addVisaRequirement.js US US FR

const passportCode = process.argv[2];
const residenceCode = process.argv[3];
const destinationCode = process.argv[4];

if (!passportCode || !residenceCode || !destinationCode) {
  console.error('Usage: node addVisaRequirement.js PASSPORT_CODE RESIDENCE_CODE DESTINATION_CODE');
  console.error('Example: node addVisaRequirement.js US US FR');
  process.exit(1);
}

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

      // Check if combination already exists
      db.get(
        `SELECT id FROM visa_requirements
         WHERE passport_country_id = ?
         AND residence_country_id = ?
         AND destination_country_id = ?`,
        [passport.id, residence.id, destination.id],
        (err, existing) => {
          if (existing) {
            console.log(`⚠️  Combination already exists with ID: ${existing.id}`);
            console.log(`   ${passport.name} (${passportCode}) -> ${destination.name} (${destinationCode})`);
            console.log(`   Residence: ${residence.name} (${residenceCode})`);
            db.close();
            return;
          }

          // Insert new visa requirement
          db.run(
            `INSERT INTO visa_requirements
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

              console.log(`✅ Added visa requirement combination with ID: ${this.lastID}`);
              console.log(`   ${passport.name} (${passportCode}) -> ${destination.name} (${destinationCode})`);
              console.log(`   Residence: ${residence.name} (${residenceCode})`);
              console.log(`\n💡 To scrape this combination, use:`);
              console.log(`   curl -X POST http://localhost:5000/api/admin/scrape/${this.lastID} -H "Authorization: Bearer YOUR_TOKEN"`);

              db.close();
            }
          );
        }
      );
    });
  });
});
