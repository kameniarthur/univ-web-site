const rateLimit = require('express-rate-limit');

/**
 * Middleware de limitation de débit
 */

// Limiteur pour les routes d'authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 tentatives maximum
    message: {
        error: 'Trop de tentatives',
        message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

// Limiteur pour les routes d'API publique
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes maximum
    message: {
        error: 'Trop de requêtes',
        message: 'Trop de requêtes depuis cette IP. Veuillez réessayer dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiteur pour les routes d'envoi de messages
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5, // 5 messages maximum par heure
    message: {
        error: 'Limite atteinte',
        message: 'Vous avez envoyé trop de messages. Veuillez réessayer dans 1 heure.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiteur pour les routes de création de ressources
const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 20, // 20 créations maximum par heure
    message: {
        error: 'Limite de création atteinte',
        message: 'Trop de ressources créées. Veuillez réessayer dans 1 heure.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware pour limiter par utilisateur (si authentifié)
function userSpecificLimiter(maxRequests) {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: maxRequests,
        keyGenerator: (req) => {
            // Utiliser l'ID utilisateur si authentifié, sinon l'IP
            return req.user ? req.user.id.toString() : req.ip;
        },
        message: {
            error: 'Limite de requêtes atteinte',
            message: `Vous ne pouvez effectuer que ${maxRequests} requêtes toutes les 15 minutes.`
        },
        standardHeaders: true,
        legacyHeaders: false
    });
}

module.exports = {
    authLimiter,
    apiLimiter,
    contactLimiter,
    createLimiter,
    userSpecificLimiter
};