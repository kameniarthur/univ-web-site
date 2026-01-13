const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'votre_cle_secrete_ultra_securisee';

/**
 * Middleware pour vérifier le token JWT
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Token d\'authentification requis',
            message: 'Vous devez être connecté pour accéder à cette ressource'
        });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({
                    error: 'Token expiré',
                    message: 'Votre session a expiré, veuillez vous reconnecter'
                });
            }
            return res.status(403).json({
                error: 'Token invalide',
                message: 'Token d\'authentification non valide'
            });
        }

        req.user = user;
        next();
    });
}

module.exports = authenticateToken;