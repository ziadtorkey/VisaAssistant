const db = require('./src/config/database');

// List all countries in the database
db.all('SELECT * FROM countries ORDER BY name', [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    process.exit(1);
  }

  console.log('\n📋 Countries in database:\n');
  rows.forEach(row => {
    const active = row.is_active ? '✅' : '❌';
    console.log(`  ${active} ${row.id}. ${row.name} (${row.code})`);
  });

  console.log(`\n📊 Total: ${rows.length} countries`);

  // Count visa requirements
  db.get('SELECT COUNT(*) as count FROM visa_requirements', [], (err, result) => {
    if (!err) {
      console.log(`📊 Total visa requirement combinations: ${result.count}\n`);
    }
    db.close();
  });
});
