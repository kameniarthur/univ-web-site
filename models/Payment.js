const pool = require('../database/config');

class Payment {
    static async create(paymentData) {
        const { user_id, amount, payment_type, payment_method, transaction_id, status } = paymentData;

        const result = await pool.query(
            `INSERT INTO payments (user_id, amount, payment_type, payment_method, transaction_id, status) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [user_id, amount, payment_type, payment_method, transaction_id, status]
        );

        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM payments WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    static async findAll(filters = {}) {
        const { status, payment_type, limit = 100, offset = 0 } = filters;

        let query = 'SELECT * FROM payments WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (payment_type) {
            query += ` AND payment_type = $${paramIndex}`;
            params.push(payment_type);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async updateStatus(id, status) {
        const result = await pool.query(
            'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query(
            'DELETE FROM payments WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async findByTransactionId(transactionId) {
        const result = await pool.query(
            'SELECT * FROM payments WHERE transaction_id = $1',
            [transactionId]
        );
        return result.rows[0];
    }

    static async sumByUser(userId) {
        const result = await pool.query(
            'SELECT SUM(amount) as total_amount FROM payments WHERE user_id = $1 AND status = $2',
            [userId, 'complete']
        );
        return parseFloat(result.rows[0].total_amount) || 0;
    }

    static async countByStatus() {
        const result = await pool.query(
            'SELECT status, COUNT(*) as count FROM payments GROUP BY status'
        );
        return result.rows;
    }

    static async getMonthlySummary(year, month) {
        const result = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_payments,
                SUM(amount) as total_amount
             FROM payments 
             WHERE EXTRACT(YEAR FROM created_at) = $1 
             AND EXTRACT(MONTH FROM created_at) = $2
             GROUP BY DATE(created_at)
             ORDER BY date`,
            [year, month]
        );
        return result.rows;
    }
}

module.exports = Payment;