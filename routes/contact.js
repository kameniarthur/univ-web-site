// ===============================================
// ROUTES API - CONTACT
// ===============================================

const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sendContactConfirmation, sendAdminNotification } = require('../services/email-service');

const router = express.Router();

router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const { first_name, last_name, email, phone, school, subject, message } = req.body;

        const result = await client.query(
            `INSERT INTO contact_messages (first_name, last_name, email, phone, school, subject, message) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [first_name, last_name, email, phone, school, subject, message]
        );

        sendContactConfirmation(email, first_name, subject);
        sendAdminNotification(email, first_name, last_name, subject, message);

        res.status(201).json({
            message: 'Message envoyé avec succès',
            messageId: result.rows[0].id
        });
    } catch (error) {
        console.error('Erreur contact:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

router.get('/messages', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé' });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT * FROM contact_messages ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur récupération messages:', error);
        res.status(500).json({ error: 'Erreur récupération messages' });
    } finally {
        client.release();
    }
});

module.exports = router;