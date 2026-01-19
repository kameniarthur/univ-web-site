// ===============================================
// SERVEUR PRINCIPAL
// ===============================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { pool } = require('./config/database');
const { initDatabase } = require('./services/database-init');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const jobOffersRoutes = require('./routes/job-offers');
const applicationsRoutes = require('./routes/applications');
const documentsRoutes = require('./routes/documents');
const paymentsRoutes = require('./routes/payments');
const eventsRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connexion base de données
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erreur connexion PostgreSQL:', err.stack);
    } else {
        console.log('✅ Base de données PostgreSQL connectée');
        release();
        initDatabase();
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/job-offers', jobOffersRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/events', eventsRoutes);

// Démarrage serveur
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║  🚀 SERVEUR UNIVERSITAIRE DÉMARRÉ   ║
    ║                                      ║
    ║  📡 Port: ${PORT}                      ║
    ║  🌐 URL: http://localhost:${PORT}     ║
    ║  ✅ Base de données: PostgreSQL      ║
    ╚══════════════════════════════════════╝
    `);
});

// Fermeture propre
process.on('SIGINT', async () => {
    await pool.end();
    console.log('🔴 Serveur arrêté');
    process.exit(0);
});