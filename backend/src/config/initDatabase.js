const db = require('./database');
const bcrypt = require('bcryptjs');

// Create tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Countries table
      db.run(`
        CREATE TABLE IF NOT EXISTS countries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Visa requirements table
      db.run(`
        CREATE TABLE IF NOT EXISTS visa_requirements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          passport_country_id INTEGER,
          residence_country_id INTEGER,
          destination_country_id INTEGER,
          visa_status TEXT,
          required_documents TEXT,
          application_steps TEXT,
          application_location TEXT,
          contact_info TEXT,
          application_form_url TEXT,
          checklist_url TEXT,
          visa_fee TEXT,
          processing_time TEXT,
          booking_link TEXT,
          source_urls TEXT,
          last_updated DATETIME,
          data_status TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (passport_country_id) REFERENCES countries(id),
          FOREIGN KEY (residence_country_id) REFERENCES countries(id),
          FOREIGN KEY (destination_country_id) REFERENCES countries(id),
          UNIQUE(passport_country_id, residence_country_id, destination_country_id)
        )
      `);

      // Scraping logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS scraping_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          visa_requirement_id INTEGER,
          status TEXT,
          error_message TEXT,
          scraped_urls TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (visa_requirement_id) REFERENCES visa_requirements(id)
        )
      `);

      // Admin users table
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User feedback table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          passport_country TEXT,
          residence_country TEXT,
          destination_country TEXT,
          visa_requirement_id INTEGER,
          status TEXT DEFAULT 'unread',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (visa_requirement_id) REFERENCES visa_requirements(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

// Seed initial data
const seedData = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      // Insert initial countries from JSON file
      const fs = require('fs');
      const path = require('path');
      const countriesPath = path.join(__dirname, 'countries.json');
      const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));

      console.log(`Seeding ${countries.length} countries...`);

      const insertCountry = db.prepare(
        'INSERT OR IGNORE INTO countries (name, code) VALUES (?, ?)'
      );

      countries.forEach(country => {
        insertCountry.run(country.name, country.code);
      });
      insertCountry.finalize();

      // Create default admin user (username: admin, password: admin123)
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.run(
        'INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)',
        ['admin', hashedPassword]
      );

      // Insert default settings
      const settings = [
        { key: 'data_expiry_days', value: '14' },
        { key: 'scraping_retry_attempts', value: '3' },
        { key: 'scraping_delay_ms', value: '2000' },
        { key: 'ai_scraper', value: 'perplexity' }
      ];

      const insertSetting = db.prepare(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
      );

      settings.forEach(setting => {
        insertSetting.run(setting.key, setting.value);
      });
      insertSetting.finalize(() => resolve());
    });
  });
};

// Initialize database
const initDatabase = async () => {
  try {
    console.log('Creating database tables...');
    await createTables();
    console.log('Tables created successfully');

    console.log('Seeding initial data...');
    await seedData();
    console.log('Data seeded successfully');
    console.log('\nDefault admin credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\nDatabase initialization completed!');

    db.close();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase, createTables, seedData };