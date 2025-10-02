const db = require('../config/database');

class VisaRequirement {
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT vr.*,
          c1.name as passport_country, c1.code as passport_code,
          c2.name as residence_country, c2.code as residence_code,
          c3.name as destination_country, c3.code as destination_code
        FROM visa_requirements vr
        LEFT JOIN countries c1 ON vr.passport_country_id = c1.id
        LEFT JOIN countries c2 ON vr.residence_country_id = c2.id
        LEFT JOIN countries c3 ON vr.destination_country_id = c3.id
        ORDER BY vr.last_updated DESC
      `;
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT vr.*,
          c1.name as passport_country, c1.code as passport_code,
          c2.name as residence_country, c2.code as residence_code,
          c3.name as destination_country, c3.code as destination_code
        FROM visa_requirements vr
        LEFT JOIN countries c1 ON vr.passport_country_id = c1.id
        LEFT JOIN countries c2 ON vr.residence_country_id = c2.id
        LEFT JOIN countries c3 ON vr.destination_country_id = c3.id
        WHERE vr.id = ?
      `;
      db.get(query, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static getByCountries(passportId, residenceId, destinationId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT vr.*,
          c1.name as passport_country, c1.code as passport_code,
          c2.name as residence_country, c2.code as residence_code,
          c3.name as destination_country, c3.code as destination_code
        FROM visa_requirements vr
        LEFT JOIN countries c1 ON vr.passport_country_id = c1.id
        LEFT JOIN countries c2 ON vr.residence_country_id = c2.id
        LEFT JOIN countries c3 ON vr.destination_country_id = c3.id
        WHERE vr.passport_country_id = ?
          AND vr.residence_country_id = ?
          AND vr.destination_country_id = ?
      `;
      db.get(query, [passportId, residenceId, destinationId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static create(data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO visa_requirements (
          passport_country_id, residence_country_id, destination_country_id,
          visa_status, required_documents, application_steps,
          application_location, contact_info, application_form_url,
          checklist_url, visa_fee, processing_time, booking_link,
          source_urls, last_updated, data_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.passport_country_id, data.residence_country_id, data.destination_country_id,
        data.visa_status, data.required_documents, data.application_steps,
        data.application_location, data.contact_info, data.application_form_url,
        data.checklist_url, data.visa_fee, data.processing_time, data.booking_link,
        data.source_urls, data.last_updated, data.data_status
      ];

      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  static update(id, data) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE visa_requirements SET
          visa_status = ?, required_documents = ?, application_steps = ?,
          application_location = ?, contact_info = ?, application_form_url = ?,
          checklist_url = ?, visa_fee = ?, processing_time = ?, booking_link = ?,
          source_urls = ?, last_updated = ?, data_status = ?
        WHERE id = ?
      `;
      const params = [
        data.visa_status, data.required_documents, data.application_steps,
        data.application_location, data.contact_info, data.application_form_url,
        data.checklist_url, data.visa_fee, data.processing_time, data.booking_link,
        data.source_urls, data.last_updated, data.data_status, id
      ];

      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM visa_requirements WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static getAllPaginated({ limit, offset, passportCountryId, residenceCountryId, destinationCountryId, dataStatus }) {
    return new Promise((resolve, reject) => {
      // Build WHERE clause dynamically
      let whereConditions = [];
      let params = [];

      if (passportCountryId) {
        whereConditions.push('vr.passport_country_id = ?');
        params.push(passportCountryId);
      }
      if (residenceCountryId) {
        whereConditions.push('vr.residence_country_id = ?');
        params.push(residenceCountryId);
      }
      if (destinationCountryId) {
        whereConditions.push('vr.destination_country_id = ?');
        params.push(destinationCountryId);
      }
      if (dataStatus) {
        whereConditions.push('vr.data_status = ?');
        params.push(dataStatus);
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM visa_requirements vr
        ${whereClause}
      `;

      db.get(countQuery, params, (err, countResult) => {
        if (err) {
          reject(err);
          return;
        }

        // Get paginated data
        const dataQuery = `
          SELECT vr.*,
            c1.name as passport_country, c1.code as passport_code,
            c2.name as residence_country, c2.code as residence_code,
            c3.name as destination_country, c3.code as destination_code
          FROM visa_requirements vr
          LEFT JOIN countries c1 ON vr.passport_country_id = c1.id
          LEFT JOIN countries c2 ON vr.residence_country_id = c2.id
          LEFT JOIN countries c3 ON vr.destination_country_id = c3.id
          ${whereClause}
          ORDER BY vr.last_updated DESC
          LIMIT ? OFFSET ?
        `;

        db.all(dataQuery, [...params, limit, offset], (err, rows) => {
          if (err) reject(err);
          else resolve({ data: rows, total: countResult.total });
        });
      });
    });
  }

  static clearScrapedData(id) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE visa_requirements
        SET
          visa_status = NULL,
          required_documents = NULL,
          application_steps = NULL,
          application_location = NULL,
          contact_info = NULL,
          application_form_url = NULL,
          checklist_url = NULL,
          visa_fee = NULL,
          processing_time = NULL,
          booking_link = NULL,
          source_urls = NULL,
          last_updated = NULL,
          data_status = 'unavailable'
        WHERE id = ?
      `;
      db.run(query, [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static getStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          COUNT(*) as total_combinations,
          SUM(CASE WHEN data_status = 'fresh' THEN 1 ELSE 0 END) as fresh_count,
          SUM(CASE WHEN data_status = 'stale' THEN 1 ELSE 0 END) as stale_count,
          SUM(CASE WHEN data_status = 'unavailable' THEN 1 ELSE 0 END) as unavailable_count,
          MIN(last_updated) as oldest_update,
          MAX(last_updated) as newest_update
        FROM visa_requirements
      `;
      db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = VisaRequirement;