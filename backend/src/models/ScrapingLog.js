const db = require('../config/database');

class ScrapingLog {
  static getAll(limit = 100) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT sl.*,
          c1.name as passport_country,
          c2.name as residence_country,
          c3.name as destination_country
        FROM scraping_logs sl
        LEFT JOIN visa_requirements vr ON sl.visa_requirement_id = vr.id
        LEFT JOIN countries c1 ON vr.passport_country_id = c1.id
        LEFT JOIN countries c2 ON vr.residence_country_id = c2.id
        LEFT JOIN countries c3 ON vr.destination_country_id = c3.id
        ORDER BY sl.timestamp DESC
        LIMIT ?
      `;
      db.all(query, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getByRequirementId(requirementId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM scraping_logs WHERE visa_requirement_id = ? ORDER BY timestamp DESC',
        [requirementId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static create(data) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO scraping_logs (visa_requirement_id, status, error_message, scraped_urls)
         VALUES (?, ?, ?, ?)`,
        [data.visa_requirement_id, data.status, data.error_message, data.scraped_urls],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  static getRecentFailures(limit = 10) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT sl.*,
          c1.name as passport_country,
          c2.name as residence_country,
          c3.name as destination_country
        FROM scraping_logs sl
        LEFT JOIN visa_requirements vr ON sl.visa_requirement_id = vr.id
        LEFT JOIN countries c1 ON vr.passport_country_id = c1.id
        LEFT JOIN countries c2 ON vr.residence_country_id = c2.id
        LEFT JOIN countries c3 ON vr.destination_country_id = c3.id
        WHERE sl.status = 'failure'
        ORDER BY sl.timestamp DESC
        LIMIT ?
      `;
      db.all(query, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = ScrapingLog;