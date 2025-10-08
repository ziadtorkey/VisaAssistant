const db = require('../database');

// Migration to add user_feedback table
const addUserFeedbackTable = () => {
  return new Promise((resolve, reject) => {
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
      if (err) {
        console.error('Error creating user_feedback table:', err);
        reject(err);
      } else {
        console.log('user_feedback table created successfully');
        resolve();
      }
    });
  });
};

// Run if called directly
if (require.main === module) {
  addUserFeedbackTable()
    .then(() => {
      console.log('Migration completed successfully');
      db.close();
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = addUserFeedbackTable;
