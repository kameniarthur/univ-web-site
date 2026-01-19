// ===============================================
// ROUTES API - PAIEMENTS
// ===============================================

const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { amount, payment_type, payment_method } = req.body;
        const userId = req.user.id;
        const transactionId = 'TXN' + Date.now();

        const result = await client.query(
            `INSERT INTO payments (user_id, amount, payment_type, payment_method, transaction_id, status) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [userId, amount, payment_type, payment_method, transactionId, 'complete']
        );

        res.status(201).json({
            message: 'Paiement enregistré',
            paymentId: result.rows[0].id,
            transactionId
        });
    } catch (error) {
        console.error('Erreur paiement:', error);
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
            'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur récupération paiements:', error);
        res.status(500).json({ error: 'Erreur récupération paiements' });
    } finally {
        client.release();
    }
});

module.exports = router;