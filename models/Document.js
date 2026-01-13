const pool = require('../database/config');

class Document {
    static async create(documentData) {
        const { user_id, document_type, file_path } = documentData;

        const result = await pool.query(
            `INSERT INTO documents (user_id, document_type, file_path) 
             VALUES ($1, $2, $3) RETURNING *`,
            [user_id, document_type, file_path]
        );

        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM documents WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM documents WHERE user_id = $1 ORDER BY requested_at DESC',
            [userId]
        );
        return result.rows;
    }

    static async findAll(filters = {}) {
        const { status, document_type, limit = 100, offset = 0 } = filters;

        let query = 'SELECT * FROM documents WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (document_type) {
            query += ` AND document_type = $${paramIndex}`;
            params.push(document_type);
            paramIndex++;
        }

        query += ' ORDER BY requested_at DESC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async updateStatus(id, status, file_path = null) {
        let query, params;

        if (file_path) {
            query = 'UPDATE documents SET status = $1, file_path = $2, delivered_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
            params = [status, file_path, id];
        } else {
            query = 'UPDATE documents SET status = $1, delivered_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
            params = [status, id];
        }

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query(
            'DELETE FROM documents WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async countByUser(userId) {
        const result = await pool.query(
            'SELECT COUNT(*) FROM documents WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    static async countByType() {
        const result = await pool.query(
            'SELECT document_type, COUNT(*) as count FROM documents GROUP BY document_type'
        );
        return result.rows;
    }

    static async countByStatus() {
        const result = await pool.query(
            'SELECT status, COUNT(*) as count FROM documents GROUP BY status'
        );
        return result.rows;
    }
}

module.exports = Document;