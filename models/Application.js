const pool = require('../database/config');

class Application {
    static async create(applicationData) {
        const { user_id, school, program, education_level, motivation, cv_path } = applicationData;

        const result = await pool.query(
            `INSERT INTO applications (user_id, school, program, education_level, motivation, cv_path) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [user_id, school, program, education_level, motivation, cv_path]
        );

        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM applications WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    static async findAll(filters = {}) {
        const { status, school, program, limit = 100, offset = 0 } = filters;

        let query = 'SELECT * FROM applications WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (school) {
            query += ` AND school ILIKE $${paramIndex}`;
            params.push(`%${school}%`);
            paramIndex++;
        }
        if (program) {
            query += ` AND program ILIKE $${paramIndex}`;
            params.push(`%${program}%`);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async updateStatus(id, status) {
        const result = await pool.query(
            'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }

    static async update(id, applicationData) {
        const { school, program, education_level, motivation, cv_path } = applicationData;

        const result = await pool.query(
            `UPDATE applications SET 
                school = $1, 
                program = $2, 
                education_level = $3, 
                motivation = $4, 
                cv_path = $5 
             WHERE id = $6 RETURNING *`,
            [school, program, education_level, motivation, cv_path, id]
        );

        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query(
            'DELETE FROM applications WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async countByUser(userId) {
        const result = await pool.query(
            'SELECT COUNT(*) FROM applications WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    static async countByStatus(status) {
        const result = await pool.query(
            'SELECT COUNT(*) FROM applications WHERE status = $1',
            [status]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = Application;