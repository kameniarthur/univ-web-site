const { Pool } = require('pg');
require('dotenv').config();

// Configuration PostgreSQL avec valeurs par défaut
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'university_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
};

// Ajouter SSL si nécessaire (pour production)
if (process.env.DB_SSL === 'true') {
    poolConfig.ssl = {
        rejectUnauthorized: false
    };
}

// Créer le pool de connexions
const pool = new Pool(poolConfig);

// Événements du pool pour le monitoring
pool.on('connect', () => {
    console.log('🔗 Nouvelle connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
    console.error('❌ Erreur inattendue sur le client PostgreSQL:', err.message);
});

pool.on('remove', () => {
    console.log('👋 Connexion PostgreSQL retirée du pool');
});

// Fonction pour tester la connexion
async function testConnection() {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        console.log(`✅ PostgreSQL connecté - Heure serveur: ${result.rows[0].current_time}`);
        return true;
    } catch (error) {
        console.error('❌ Échec de connexion à PostgreSQL:', error.message);
        return false;
    } finally {
        if (client) client.release();
    }
}

// Fonction pour exécuter une requête
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        // Logger les requêtes lentes en développement
        if (process.env.NODE_ENV === 'development' && duration > 100) {
            console.log(`🐌 Requête lente (${duration}ms):`, { text, params });
        }

        return result;
    } catch (error) {
        console.error('❌ Erreur requête PostgreSQL:', {
            query: text,
            params,
            error: error.message
        });
        throw error;
    }
}

// Fonction pour obtenir un client transactionnel
async function getTransactionClient() {
    const client = await pool.connect();

    // Méthodes transactionnelles
    const transaction = {
        query: client.query.bind(client),
        release: client.release.bind(client),

        async begin() {
            await client.query('BEGIN');
        },

        async commit() {
            await client.query('COMMIT');
        },

        async rollback() {
            await client.query('ROLLBACK');
        },

        async executeTransaction(callback) {
            try {
                await this.begin();
                const result = await callback(this);
                await this.commit();
                return result;
            } catch (error) {
                await this.rollback();
                throw error;
            } finally {
                this.release();
            }
        }
    };

    return transaction;
}

// Fonction pour obtenir les statistiques du pool
function getPoolStats() {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
    };
}

// Fonction pour fermer proprement le pool
async function closePool() {
    console.log('🔄 Fermeture du pool PostgreSQL...');
    try {
        await pool.end();
        console.log('✅ Pool PostgreSQL fermé avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de la fermeture du pool:', error.message);
    }
}

// Fonction pour initialiser la base de données (création des tables)
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        console.log('📦 Initialisation de la base de données...');

        // Table Utilisateurs
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                role VARCHAR(20) DEFAULT 'student',
                school VARCHAR(100),
                program VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "users" créée/vérifiée');

        // Table Messages Contact
        await client.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                school VARCHAR(100),
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'nouveau',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "contact_messages" créée/vérifiée');

        // Table Offres Emploi/Stage
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_offers (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                company VARCHAR(255) NOT NULL,
                contact_person VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                address TEXT,
                city VARCHAR(100),
                postal_code VARCHAR(10),
                sector VARCHAR(100),
                missions TEXT,
                education_level VARCHAR(50),
                file_path VARCHAR(255),
                status VARCHAR(20) DEFAULT 'en_attente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "job_offers" créée/vérifiée');

        // Table Candidatures
        await client.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                school VARCHAR(100) NOT NULL,
                program VARCHAR(100) NOT NULL,
                education_level VARCHAR(50) NOT NULL,
                motivation TEXT,
                cv_path VARCHAR(255),
                status VARCHAR(20) DEFAULT 'en_cours',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "applications" créée/vérifiée');

        // Table Documents
        await client.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                document_type VARCHAR(100) NOT NULL,
                status VARCHAR(20) DEFAULT 'en_attente',
                file_path VARCHAR(255),
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                delivered_at TIMESTAMP
            )
        `);
        console.log('✅ Table "documents" créée/vérifiée');

        // Table Paiements
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                payment_type VARCHAR(50) NOT NULL,
                payment_method VARCHAR(50),
                transaction_id VARCHAR(100),
                status VARCHAR(20) DEFAULT 'en_attente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "payments" créée/vérifiée');

        // Table Événements
        await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                event_date TIMESTAMP NOT NULL,
                location VARCHAR(255),
                category VARCHAR(50),
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "events" créée/vérifiée');

        // Créer les index pour améliorer les performances
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_job_offers_status ON job_offers(status)');

        console.log('✅ Index créés/vérifiés');
        console.log('🎉 Base de données initialisée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Exporter les fonctions et le pool
module.exports = {
    pool,                    // Pool PostgreSQL
    query,                   // Fonction pour exécuter des requêtes
    getTransactionClient,    // Pour les transactions
    getPoolStats,           // Statistiques du pool
    testConnection,         // Tester la connexion
    closePool,              // Fermer le pool
    initializeDatabase      // Initialiser les tables
};