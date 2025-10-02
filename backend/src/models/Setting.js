const db = require('../config/database');

class Setting {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM settings', (err, rows) => {
        if (err) reject(err);
        else {
          // Convert to key-value object
          const settings = {};
          rows.forEach(row => {
            settings[row.key] = row.value;
          });
          resolve(settings);
        }
      });
    });
  }

  static get(key) {
    return new Promise((resolve, reject) => {
      db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.value : null);
      });
    });
  }

  static set(key, value) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
        [key, value, value],
        function(err) {
          if (err) reject(err);
          else resolve({ key, value });
        }
      );
    });
  }

  static updateMultiple(settings) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const stmt = db.prepare(
          `INSERT INTO settings (key, value, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`
        );

        for (const [key, value] of Object.entries(settings)) {
          stmt.run(key, value, value);
        }

        stmt.finalize((err) => {
          if (err) reject(err);
          else resolve(settings);
        });
      });
    });
  }
}

module.exports = Setting;