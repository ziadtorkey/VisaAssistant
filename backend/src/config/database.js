const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use persistent disk path on Render, or local path for development
const dbPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../../database.sqlite')
  : path.join(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

module.exports = db;