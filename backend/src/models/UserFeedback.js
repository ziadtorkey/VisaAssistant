const db = require('../config/database');

class UserFeedback {
  static create(data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO user_feedback (
          email, message, passport_country, residence_country,
          destination_country, visa_requirement_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.email,
        data.message,
        data.passport_country || null,
        data.residence_country || null,
        data.destination_country || null,
        data.visa_requirement_id || null,
        'unread'
      ];

      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT f.*,
          vr.id as requirement_id
        FROM user_feedback f
        LEFT JOIN visa_requirements vr ON f.visa_requirement_id = vr.id
        ORDER BY f.created_at DESC
      `;
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getAllPaginated({ limit, offset, status }) {
    return new Promise((resolve, reject) => {
      let whereClause = '';
      let params = [];

      if (status) {
        whereClause = 'WHERE f.status = ?';
        params.push(status);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_feedback f
        ${whereClause}
      `;

      db.get(countQuery, params, (err, countResult) => {
        if (err) {
          reject(err);
          return;
        }

        // Get paginated data
        const dataQuery = `
          SELECT f.*,
            vr.id as requirement_id,
            c1.name as passport_country_name,
            c2.name as residence_country_name,
            c3.name as destination_country_name
          FROM user_feedback f
          LEFT JOIN visa_requirements vr ON f.visa_requirement_id = vr.id
          LEFT JOIN countries c1 ON vr.passport_country_id = c1.id
          LEFT JOIN countries c2 ON vr.residence_country_id = c2.id
          LEFT JOIN countries c3 ON vr.destination_country_id = c3.id
          ${whereClause}
          ORDER BY f.created_at DESC
          LIMIT ? OFFSET ?
        `;

        db.all(dataQuery, [...params, limit, offset], (err, rows) => {
          if (err) reject(err);
          else resolve({ data: rows, total: countResult.total });
        });
      });
    });
  }

  static markAsRead(id) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE user_feedback SET status = ? WHERE id = ?';
      db.run(query, ['read', id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM user_feedback WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static getStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read
        FROM user_feedback
      `;
      db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = UserFeedback;
