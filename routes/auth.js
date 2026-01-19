// ===============================================
// ROUTES API - AUTHENTIFICATION
// ===============================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendWelcomeEmail } = require('../services/email-service');
const { SECRET_KEY } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
    const client = await pool.connect();
    try {
        const { email, password, first_name, last_name, phone, school, program } = req.body;

        const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await client.query(
            `INSERT INTO users (email, password, first_name, last_name, phone, school, program) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [email, hashedPassword, first_name, last_name, phone, school, program]
        );

        sendWelcomeEmail(email, first_name);

        res.status(201).json({
            message: 'Compte créé avec succès',
            userId: result.rows[0].id
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

router.post('/login', async (req, res) => {
    const client = await pool.connect();
    try {
        const { email, password } = req.body;

        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                school: user.school,
                program: user.program
            }
        });
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    } finally {
        client.release();
    }
});

module.exports = router;