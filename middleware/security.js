const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

/**
 * Middleware de sécurité
 */

// Configuration Helmet pour les headers de sécurité
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
});

// Nettoyage des données contre XSS
function xssClean() {
    return xss();
}

// Nettoyage contre les injections NoSQL
function noSqlInjectionClean() {
    return mongoSanitize({
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
            console.warn(`⚠️ Tentative d'injection NoSQL détectée: ${key}`, req.ip);
        }
    });
}

// Protection contre la pollution des paramètres
function parameterPollutionProtection() {
    return hpp();
}

// Middleware pour éviter le clickjacking
function noClickjacking(req, res, next) {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
}

// Middleware pour éviter le sniffing MIME
function noMimeSniffing(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}

// Middleware pour référent policy
function referrerPolicy(req, res, next) {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
}

// Middleware pour limiter les requêtes lentes (Slowloris)
function slowDownRequest(req, res, next) {
    let requestStartTime = Date.now();
    let requestTimeout = 30000; // 30 secondes

    // Vérifier le temps de la requête
    res.on('finish', () => {
        const requestTime = Date.now() - requestStartTime;
        if (requestTime > 10000) { // Plus de 10 secondes
            console.warn(`⚠️ Requête lente détectée: ${req.method} ${req.originalUrl} - ${requestTime}ms`);
        }
    });

    // Timeout pour les requêtes trop longues
    req.setTimeout(requestTimeout, () => {
        console.error(`⏰ Timeout de requête: ${req.method} ${req.originalUrl}`);
        if (!res.headersSent) {
            res.status(408).json({ error: 'Délai d\'attente dépassé' });
        }
    });

    next();
}

// Middleware pour valider les types de contenu
function validateContentType(req, res, next) {
    const allowedMethods = ['POST', 'PUT', 'PATCH'];

    if (allowedMethods.includes(req.method)) {
        const contentType = req.headers['content-type'];

        if (!contentType || !contentType.includes('application/json')) {
            return res.status(415).json({
                error: 'Type de contenu non supporté',
                message: 'Seul le type application/json est accepté'
            });
        }
    }

    next();
}

module.exports = {
    helmetConfig,
    xssClean,
    noSqlInjectionClean,
    parameterPollutionProtection,
    noClickjacking,
    noMimeSniffing,
    referrerPolicy,
    slowDownRequest,
    validateContentType
};