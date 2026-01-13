/**
 * Middleware pour vérifier les rôles des utilisateurs
 */

// Middleware pour vérifier si l'utilisateur est admin
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Accès interdit',
            message: 'Cette action nécessite des privilèges d\'administrateur'
        });
    }
    next();
}

// Middleware pour vérifier si l'utilisateur est étudiant
function isStudent(req, res, next) {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            error: 'Accès interdit',
            message: 'Cette action est réservée aux étudiants'
        });
    }
    next();
}

// Middleware pour vérifier plusieurs rôles
function hasRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Non authentifié',
                message: 'Vous devez être connecté'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Accès interdit',
                message: `Rôle requis: ${roles.join(' ou ')}`,
                votre_role: req.user.role
            });
        }
        next();
    };
}

// Middleware pour vérifier si l'utilisateur accède à ses propres données
function isOwnerOrAdmin(req, res, next) {
    const resourceUserId = parseInt(req.params.userId || req.params.id);

    if (req.user.role !== 'admin' && req.user.id !== resourceUserId) {
        return res.status(403).json({
            error: 'Accès interdit',
            message: 'Vous ne pouvez accéder qu\'à vos propres données'
        });
    }
    next();
}

module.exports = {
    isAdmin,
    isStudent,
    hasRole,
    isOwnerOrAdmin
};