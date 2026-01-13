const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const contactRoutes = require('./contactRoutes');
const jobRoutes = require('./jobRoutes');
const applicationRoutes = require('./applicationRoutes');
const documentRoutes = require('./documentRoutes');
const paymentRoutes = require('./paymentRoutes');
const eventRoutes = require('./eventRoutes');
const healthRoutes = require('./healthRoutes');

// Middleware
const { apiLimiter } = require('../middleware/rateLimiter');
const { requestLogger, performanceLogger } = require('../middleware/logging');

// Appliquer le rate limiting global
router.use(apiLimiter);

// Appliquer le logging
router.use(requestLogger);
router.use(performanceLogger);

// Routes de santé (sans logging détaillé)
router.use('/health', healthRoutes);

// Routes API
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/contact', contactRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/documents', documentRoutes);
router.use('/payments', paymentRoutes);
router.use('/events', eventRoutes);

// Route racine
router.get('/', (req, res) => {
    res.json({
        message: 'API Universitaire - Bienvenue',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            contact: '/api/contact',
            jobs: '/api/jobs',
            applications: '/api/applications',
            documents: '/api/documents',
            payments: '/api/payments',
            events: '/api/events',
            health: '/api/health'
        },
        documentation: 'https://docs.universite-api.com'
    });
});

// Route 404 pour les endpoints inexistants
router.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint non trouvé',
        message: `La route ${req.originalUrl} n'existe pas`,
        availableEndpoints: [
            '/api/auth',
            '/api/users',
            '/api/contact',
            '/api/jobs',
            '/api/applications',
            '/api/documents',
            '/api/payments',
            '/api/events',
            '/api/health'
        ]
    });
});

module.exports = router;