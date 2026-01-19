// ===============================================
// ROUTES API - CANDIDATURES
// ===============================================

const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sendApplicationConfirmation } = require('../services/email-service');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { school, program, education_level, motivation } = req.body;
        const userId = req.user.id;

        const result = await client.query(
            `INSERT INTO applications (user_id, school, program, education_level, motivation) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [userId, school, program, education_level, motivation]
        );

        sendApplicationConfirmation(req.user.email, school, program);

        res.status(201).json({
            message: 'Candidature envoyée avec succès',
            applicationId: result.rows[0].id
        });
    } catch (error) {
        console.error('Erreur candidature:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

router.get('/my', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;

        const result = await client.query(
            'SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur récupération candidatures:', error);
        res.status(500).json({ error: 'Erreur récupération candidatures' });
    } finally {
        client.release();
    }
});

module.exports = router;