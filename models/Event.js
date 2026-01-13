const pool = require('../database/config');

class Event {
    static async create(eventData) {
        const { title, description, event_date, location, category, image_url } = eventData;

        const result = await pool.query(
            `INSERT INTO events (title, description, event_date, location, category, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, description, event_date, location, category, image_url]
        );

        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM events WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async findAll(filters = {}) {
        const { category, upcoming = true, limit = 100, offset = 0 } = filters;

        let query = 'SELECT * FROM events WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (upcoming) {
            query += ` AND event_date >= CURRENT_DATE`;
        }

        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        query += ' ORDER BY event_date ASC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async update(id, eventData) {
        const { title, description, event_date, location, category, image_url } = eventData;

        const result = await pool.query(
            `UPDATE events SET 
                title = $1, 
                description = $2, 
                event_date = $3, 
                location = $4, 
                category = $5, 
                image_url = $6 
             WHERE id = $7 RETURNING *`,
            [title, description, event_date, location, category, image_url, id]
        );

        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query(
            'DELETE FROM events WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async findUpcoming(days = 30) {
        const result = await pool.query(
            `SELECT * FROM events 
             WHERE event_date >= CURRENT_DATE 
             AND event_date <= CURRENT_DATE + INTERVAL '${days} days'
             ORDER BY event_date ASC`
        );
        return result.rows;
    }

    static async findPast(limit = 50) {
        const result = await pool.query(
            'SELECT * FROM events WHERE event_date < CURRENT_DATE ORDER BY event_date DESC LIMIT $1',
            [limit]
        );
        return result.rows;
    }

    static async countByCategory() {
        const result = await pool.query(
            'SELECT category, COUNT(*) as count FROM events GROUP BY category'
        );
        return result.rows;
    }

    static async findByDateRange(startDate, endDate) {
        const result = await pool.query(
            'SELECT * FROM events WHERE event_date BETWEEN $1 AND $2 ORDER BY event_date ASC',
            [startDate, endDate]
        );
        return result.rows;
    }

    static async search(query) {
        const result = await pool.query(
            `SELECT * FROM events 
             WHERE title ILIKE $1 OR description ILIKE $1 OR location ILIKE $1 
             ORDER BY event_date ASC`,
            [`%${query}%`]
        );
        return result.rows;
    }
}

module.exports = Event;