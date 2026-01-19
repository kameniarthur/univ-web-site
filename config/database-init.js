// ===============================================
// INITIALISATION BASE DE DONNÉES POSTGRESQL
// ===============================================

const { pool } = require('../config/database');

async function initDatabase() {
    const client = await pool.connect();
    try {
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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

        await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)');

        console.log('✅ Tables PostgreSQL créées avec succès');
    } catch (error) {
        console.error('❌ Erreur création tables:', error);
    } finally {
        client.release();
    }
}

module.exports = { initDatabase };