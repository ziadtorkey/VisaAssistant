const db = require('../config/database');
const bcrypt = require('bcryptjs');

class AdminUser {
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static create(username, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
          'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
          [username, hashedPassword],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, username });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = AdminUser;