const db = require('./src/config/database');

// Example: Add a new country
// Usage: node addCountry.js "Country Name" "CODE"
// Example: node addCountry.js "United States" "US"

const countryName = process.argv[2];
const countryCode = process.argv[3];

if (!countryName || !countryCode) {
  console.error('Usage: node addCountry.js "Country Name" "CODE"');
  console.error('Example: node addCountry.js "United States" "US"');
  process.exit(1);
}

db.run(
  `INSERT INTO countries (name, code, is_active) VALUES (?, ?, 1)`,
  [countryName, countryCode],
  function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint')) {
        console.error(`❌ Country "${countryName}" (${countryCode}) already exists`);
      } else {
        console.error('❌ Error:', err.message);
      }
      db.close();
      process.exit(1);
    }

    console.log(`✅ Added country: ${countryName} (${countryCode}) with ID: ${this.lastID}`);

    // Show all countries
    db.all('SELECT * FROM countries ORDER BY name', [], (err, rows) => {
      if (err) {
        console.error('Error fetching countries:', err);
      } else {
        console.log('\n📋 All countries:');
        rows.forEach(row => {
          console.log(`  ${row.id}. ${row.name} (${row.code})`);
        });
      }
      db.close();
    });
  }
);
