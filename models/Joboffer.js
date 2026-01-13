const pool = require('../database/config');

class JobOffer {
    static async create(offerData) {
        const {
            type, company, contact_person, email, phone,
            address, city, postal_code, sector, missions, education_level
        } = offerData;

        const result = await pool.query(
            `INSERT INTO job_offers (type, company, contact_person, email, phone, address, city, postal_code, sector, missions, education_level) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [type, company, contact_person, email, phone, address, city, postal_code, sector, missions, education_level]
        );

        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM job_offers WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async findAll(filters = {}) {
        const { type, city, status = 'active', limit = 100, offset = 0 } = filters;

        let query = 'SELECT * FROM job_offers WHERE status = $1';
        const params = [status];
        let paramIndex = 2;

        if (type) {
            query += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        if (city) {
            query += ` AND city ILIKE $${paramIndex}`;
            params.push(`%${city}%`);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async updateStatus(id, status) {
        const result = await pool.query(
            'UPDATE job_offers SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query(
            'DELETE FROM job_offers WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async findByCompany(company) {
        const result = await pool.query(
            'SELECT * FROM job_offers WHERE company ILIKE $1 ORDER BY created_at DESC',
            [`%${company}%`]
        );
        return result.rows;
    }

    static async count() {
        const result = await pool.query(
            'SELECT COUNT(*) FROM job_offers'
        );
        return parseInt(result.rows[0].count);
    }

    static async countByType() {
        const result = await pool.query(
            'SELECT type, COUNT(*) as count FROM job_offers GROUP BY type'
        );
        return result.rows;
    }
}

module.exports = JobOffer;