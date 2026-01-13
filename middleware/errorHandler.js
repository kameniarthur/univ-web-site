/**
 * Middleware global de gestion des erreurs
 */

// Gestionnaire d'erreurs 404
function notFound(req, res, next) {
    const error = new Error(`Route non trouvée - ${req.originalUrl}`);
    error.status = 404;
    next(error);
}

// Gestionnaire d'erreurs global
function errorHandler(err, req, res, next) {
    let statusCode = err.status || 500;
    let message = err.message || 'Erreur interne du serveur';
    let details = null;

    // Déterminer le message d'erreur en fonction du type
    switch (true) {
        case err.name === 'ValidationError':
            statusCode = 400;
            message = 'Erreur de validation';
            details = err.errors;
            break;

        case err.name === 'UnauthorizedError':
            statusCode = 401;
            message = 'Non autorisé';
            break;

        case err.name === 'ForbiddenError':
            statusCode = 403;
            message = 'Accès interdit';
            break;

        case err.name === 'NotFoundError':
            statusCode = 404;
            message = 'Ressource non trouvée';
            break;

        case err.code === '23505': // Violation de contrainte unique PostgreSQL
            statusCode = 409;
            message = 'Conflit - La ressource existe déjà';
            break;

        case err.code === '23503': // Violation de clé étrangère PostgreSQL
            statusCode = 400;
            message = 'Référence invalide';
            break;

        case err.code === '22P02': // Erreur de syntaxe PostgreSQL
            statusCode = 400;
            message = 'Format de données invalide';
            break;
    }

    // Journalisation des erreurs en développement
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erreur:', {
            status: statusCode,
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query,
            user: req.user ? req.user.id : 'Non authentifié'
        });
    }

    // Réponse d'erreur structurée
    const errorResponse = {
        success: false,
        error: {
            message,
            status: statusCode,
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        }
    };

    // Ajouter les détails si disponibles
    if (details) {
        errorResponse.error.details = details;
    }

    // Ajouter la stack trace en développement uniquement
    if (process.env.NODE_ENV === 'development' && err.stack) {
        errorResponse.error.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
}

// Middleware pour wrapper les contrôleurs async
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Créer des erreurs personnalisées
function createError(status, message, details = null) {
    const error = new Error(message);
    error.status = status;
    if (details) {
        error.details = details;
    }
    return error;
}

module.exports = {
    notFound,
    errorHandler,
    asyncHandler,
    createError
};