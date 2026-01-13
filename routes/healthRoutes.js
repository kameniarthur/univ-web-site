const express = require('express');
const router = express.Router();
const pool = require('../database/config');

// Route de santé de l'API
router.get('/', async (req, res) => {
    try {
        const healthCheck = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: 'checking'
        };

        // Vérifier la connexion à la base de données
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();

        healthCheck.database = 'connected';

        res.json(healthCheck);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            database: 'disconnected'
        });
    }
});

// Route de version
router.get('/version', (req, res) => {
    const packageJson = require('../../package.json');

    res.json({
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Route de métriques
router.get('/metrics', (req, res) => {
    const metrics = {
        process: {
            pid: process.pid,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        },
        system: {
            arch: process.arch,
            platform: process.platform,
            nodeVersion: process.version
        }
    };

    res.json(metrics);
});

module.exports = router;