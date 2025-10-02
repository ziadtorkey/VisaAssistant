const db = require('../config/database');

class Country {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM countries ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getActive() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM countries WHERE is_active = 1 ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM countries WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static create(name, code) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO countries (name, code) VALUES (?, ?)',
        [name, code],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, code });
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM countries WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static toggleActive(id, isActive) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE countries SET is_active = ? WHERE id = ?',
        [isActive, id],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }
}

module.exports = Country;