const pool = require('../database/config');
const bcrypt = require('bcrypt');

class User {
    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT id, email, first_name, last_name, role, school, program, phone, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async create(userData) {
        const { email, password, first_name, last_name, phone, school, program } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (email, password, first_name, last_name, phone, school, program) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, role`,
            [email, hashedPassword, first_name, last_name, phone, school, program]
        );

        return result.rows[0];
    }

    static async update(id, userData) {
        const { first_name, last_name, phone, school, program } = userData;

        const result = await pool.query(
            `UPDATE users SET 
                first_name = $1, 
                last_name = $2, 
                phone = $3, 
                school = $4, 
                program = $5,
                updated_at = CURRENT_TIMESTAMP 
             WHERE id = $6 RETURNING id, email, first_name, last_name, role, school, program`,
            [first_name, last_name, phone, school, program, id]
        );

        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async findAll(limit = 100, offset = 0) {
        const result = await pool.query(
            'SELECT id, email, first_name, last_name, role, school, program, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        return result.rows;
    }
}

module.exports = User;