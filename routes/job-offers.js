// ===============================================
// ROUTES API - OFFRES EMPLOI/STAGE
// ===============================================

const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            type, company, contact_person, email, phone,
            address, city, postal_code, sector, missions, education_level
        } = req.body;

        const result = await client.query(
            `INSERT INTO job_offers (type, company, contact_person, email, phone, address, city, postal_code, sector, missions, education_level) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [type, company, contact_person, email, phone, address, city, postal_code, sector, missions, education_level]
        );

        res.status(201).json({
            message: 'Offre créée avec succès',
            offerId: result.rows[0].id
        });
    } catch (error) {
        console.error('Erreur création offre:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const { type, city } = req.query;
        let query = 'SELECT * FROM job_offers WHERE status = $1';
        const params = ['active'];
        let paramIndex = 2;

        if (type) {
            query += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        if (city) {
            query += ` AND city ILIKE $${paramIndex}`;
            params.push(`%${city}%`);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur récupération offres:', error);
        res.status(500).json({ error: 'Erreur récupération offres' });
    } finally {
        client.release();
    }
});

module.exports = router;