// ===============================================
// ROUTES API - ÉVÉNEMENTS
// ===============================================

const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT * FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur récupération événements:', error);
        res.status(500).json({ error: 'Erreur récupération événements' });
    } finally {
        client.release();
    }
});

router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé' });
    }

    const client = await pool.connect();
    try {
        const { title, description, event_date, location, category } = req.body;

        const result = await client.query(
            'INSERT INTO events (title, description, event_date, location, category) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [title, description, event_date, location, category]
        );

        res.status(201).json({
            message: 'Événement créé',
            eventId: result.rows[0].id
        });
    } catch (error) {
        console.error('Erreur création événement:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

module.exports = router;