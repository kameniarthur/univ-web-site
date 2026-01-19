// ===============================================
// ROUTES API - DOCUMENTS
// ===============================================

const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/request', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { document_type } = req.body;
        const userId = req.user.id;

        const result = await client.query(
            'INSERT INTO documents (user_id, document_type) VALUES ($1, $2) RETURNING id',
            [userId, document_type]
        );

        res.status(201).json({
            message: 'Demande enregistrée',
            documentId: result.rows[0].id
        });
    } catch (error) {
        console.error('Erreur demande document:', error);
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
            'SELECT * FROM documents WHERE user_id = $1 ORDER BY requested_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur récupération documents:', error);
        res.status(500).json({ error: 'Erreur récupération documents' });
    } finally {
        client.release();
    }
});

module.exports = router;