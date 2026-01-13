const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

/**
 * Middleware de journalisation
 */

// Format personnalisé pour Morgan
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Configuration de Morgan pour la console
const consoleLogger = morgan(morganFormat, {
    skip: (req, res) => {
        // Ne pas logger les requêtes de santé
        return req.path === '/api/health' || req.path === '/health';
    }
});

// Configuration de Morgan pour les fichiers
function fileLogger(logDirectory = './logs') {
    // Créer le répertoire de logs s'il n'existe pas
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }

    // Créer un stream d'écriture pour les logs d'accès
    const accessLogStream = fs.createWriteStream(
        path.join(logDirectory, 'access.log'),
        { flags: 'a' }
    );

    return morgan('combined', {
        stream: accessLogStream,
        skip: (req, res) => res.statusCode < 400 // Ne logger que les erreurs
    });
}

// Middleware de journalisation des requêtes
function requestLogger(req, res, next) {
    const startTime = Date.now();

    // Journaliser quand la réponse est terminée
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user ? req.user.id : 'anonymous',
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            params: Object.keys(req.params).length > 0 ? req.params : undefined
        };

        // Journaliser différemment selon le statut
        if (res.statusCode >= 500) {
            console.error('❌ Erreur serveur:', logEntry);
        } else if (res.statusCode >= 400) {
            console.warn('⚠️ Erreur client:', logEntry);
        } else if (process.env.NODE_ENV === 'development') {
            console.log('✅ Requête réussie:', logEntry);
        }
    });

    next();
}

// Middleware de journalisation des erreurs
function errorLogger(err, req, res, next) {
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user ? req.user.id : 'anonymous',
        body: req.body,
        params: req.params,
        query: req.query
    };

    // Écrire l'erreur dans un fichier
    const logDirectory = './logs';
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }

    const errorLogFile = path.join(logDirectory, 'error.log');
    fs.appendFileSync(errorLogFile, JSON.stringify(errorLog) + '\n');

    // Journaliser dans la console
    console.error('🔥 Erreur non gérée:', errorLog);

    next(err);
}

// Middleware pour journaliser les actions utilisateur
function userActionLogger(action) {
    return (req, res, next) => {
        const userLog = {
            timestamp: new Date().toISOString(),
            userId: req.user ? req.user.id : 'anonymous',
            action,
            resource: req.originalUrl,
            method: req.method,
            ip: req.ip,
            details: req.body ? { ...req.body } : {}
        };

        // Supprimer les données sensibles
        if (userLog.details.password) {
            delete userLog.details.password;
        }
        if (userLog.details.token) {
            delete userLog.details.token;
        }

        const logDirectory = './logs';
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory, { recursive: true });
        }

        const userLogFile = path.join(logDirectory, 'user-actions.log');
        fs.appendFileSync(userLogFile, JSON.stringify(userLog) + '\n');

        next();
    };
}

// Middleware pour journaliser les performances
function performanceLogger(req, res, next) {
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage();

    res.on('finish', () => {
        const diff = process.hrtime(startTime);
        const duration = diff[0] * 1e3 + diff[1] * 1e-6; // en millisecondes

        const endMemory = process.memoryUsage();
        const memoryUsed = {
            rss: endMemory.rss - startMemory.rss,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed
        };

        // Journaliser les requêtes lentes
        if (duration > 1000) { // Plus d'1 seconde
            const perfLog = {
                timestamp: new Date().toISOString(),
                url: req.originalUrl,
                method: req.method,
                duration: `${duration.toFixed(2)}ms`,
                memoryUsed: `${Math.round(memoryUsed.heapUsed / 1024 / 1024)}MB`,
                warning: 'Requête lente détectée'
            };

            console.warn('🐌 Requête lente:', perfLog);
        }
    });

    next();
}

module.exports = {
    consoleLogger,
    fileLogger,
    requestLogger,
    errorLogger,
    userActionLogger,
    performanceLogger
};