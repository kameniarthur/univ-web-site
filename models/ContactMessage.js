const pool = require('../database/config');

class ContactMessage {
    static async create(messageData) {
        const { first_name, last_name, email, phone, school, subject, message } = messageData;

        const result = await pool.query(
            `INSERT INTO contact_messages (first_name, last_name, email, phone, school, subject, message) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [first_name, last_name, email, phone, school, subject, message]
        );

        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM contact_messages WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async findAll(limit = 100, offset = 0) {
        const result = await pool.query(
            'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        return result.rows;
    }

    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM contact_messages WHERE email = $1 ORDER BY created_at DESC',
            [email]
        );
        return result.rows;
    }

    static async updateStatus(id, status) {
        const result = await pool.query(
            'UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query(
            'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async count() {
        const result = await pool.query(
            'SELECT COUNT(*) FROM contact_messages'
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = ContactMessage;