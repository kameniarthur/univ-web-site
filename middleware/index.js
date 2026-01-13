// Authentification
const authenticateToken = require('./auth');

// Vérification des rôles
const { isAdmin, isStudent, hasRole, isOwnerOrAdmin } = require('./roleCheck');

// Validation
const {
    validateUser,
    validateContact,
    validateJobOffer,
    validateApplication,
    validatePayment,
    validateEvent
} = require('./validation');

// Gestion des erreurs
const { notFound, errorHandler, asyncHandler, createError } = require('./errorHandler');

// Limitation de débit
const {
    authLimiter,
    apiLimiter,
    contactLimiter,
    createLimiter,
    userSpecificLimiter
} = require('./rateLimiter');

// Sécurité
const {
    helmetConfig,
    xssClean,
    noSqlInjectionClean,
    parameterPollutionProtection,
    noClickjacking,
    noMimeSniffing,
    referrerPolicy,
    slowDownRequest,
    validateContentType
} = require('./security');

// Journalisation
const {
    consoleLogger,
    fileLogger,
    requestLogger,
    errorLogger,
    userActionLogger,
    performanceLogger
} = require('./logging');

// Upload de fichiers
const {
    uploadCV,
    uploadDocument,
    uploadJobOffer,
    uploadProfileImage,
    validateUpload,
    cleanupUploads,
    deleteFile
} = require('./fileUpload');

module.exports = {
    // Authentification
    authenticateToken,

    // Rôles
    isAdmin,
    isStudent,
    hasRole,
    isOwnerOrAdmin,

    // Validation
    validateUser,
    validateContact,
    validateJobOffer,
    validateApplication,
    validatePayment,
    validateEvent,

    // Erreurs
    notFound,
    errorHandler,
    asyncHandler,
    createError,

    // Rate limiting
    authLimiter,
    apiLimiter,
    contactLimiter,
    createLimiter,
    userSpecificLimiter,

    // Sécurité
    helmetConfig,
    xssClean,
    noSqlInjectionClean,
    parameterPollutionProtection,
    noClickjacking,
    noMimeSniffing,
    referrerPolicy,
    slowDownRequest,
    validateContentType,

    // Journalisation
    consoleLogger,
    fileLogger,
    requestLogger,
    errorLogger,
    userActionLogger,
    performanceLogger,

    // Upload
    uploadCV,
    uploadDocument,
    uploadJobOffer,
    uploadProfileImage,
    validateUpload,
    cleanupUploads,
    deleteFile
};