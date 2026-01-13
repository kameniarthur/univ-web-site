const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import des middlewares
const {
    helmetConfig,
    xssClean,
    noSqlInjectionClean,
    parameterPollutionProtection,
    noClickjacking,
    noMimeSniffing,
    referrerPolicy,
    slowDownRequest,
    validateContentType,
    consoleLogger,
    fileLogger,
    errorLogger,
    notFound,
    errorHandler
} = require('./middleware');

// Import des routes principales
const routes = require('./routes');

// Initialisation de la base de données
require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = '/api';

// ===============================================
// MIDDLEWARE DE SÉCURITÉ
// ===============================================
app.use(helmetConfig);
app.use(xssClean());
app.use(noSqlInjectionClean());
app.use(parameterPollutionProtection());
app.use(noClickjacking);
app.use(noMimeSniffing);
app.use(referrerPolicy);
app.use(slowDownRequest);
app.use(validateContentType);

// ===============================================
// MIDDLEWARE DE BASE
// ===============================================
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24 heures
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ===============================================
// MIDDLEWARE DE LOGGING
// ===============================================
app.use(consoleLogger);
app.use(fileLogger());

// ===============================================
// SERVIR LES FICHIERS STATIQUES
// ===============================================
app.use('/uploads', express.static('public/uploads'));
app.use('/docs', express.static('public/docs'));

// ===============================================
// ROUTES API
// ===============================================
app.use(API_PREFIX, routes);

// ===============================================
// GESTION DES ERREURS
// ===============================================
app.use(notFound);
app.use(errorLogger);
app.use(errorHandler);

// ===============================================
// DÉMARRAGE DU SERVEUR
// ===============================================
const server = app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║  🚀 SERVEUR UNIVERSITAIRE DÉMARRÉ   ║
    ║                                      ║
    ║  📡 Port: ${PORT}                      ║
    ║  🌐 URL: http://localhost:${PORT}     ║
    ║  📂 API: http://localhost:${PORT}/api ║
    ║  🗄️  Architecture: MVC               ║
    ║  🔒 Mode: ${process.env.NODE_ENV || 'development'} ║
    ╚══════════════════════════════════════╝
    `);
});

// ===============================================
// GESTION DE LA FERMETURE PROPRE
// ===============================================
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    console.log('🔴 Démarrage de l\'arrêt gracieux du serveur...');

    try {
        // Fermer le serveur HTTP
        server.close(() => {
            console.log('✅ Serveur HTTP fermé');
            process.exit(0);
        });

        // Timeout de sécurité
        setTimeout(() => {
            console.error('⏰ Timeout de fermeture, arrêt forcé');
            process.exit(1);
        }, 10000);

    } catch (error) {
        console.error('❌ Erreur lors de l\'arrêt gracieux:', error);
        process.exit(1);
    }
}

module.exports = app;