const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { validateJobOffer } = require('../middleware/validation');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadJobOffer, validateUpload } = require('../middleware/fileUpload');

// Routes publiques
router.get('/',
    apiLimiter,
    asyncHandler(jobController.getAllOffers)
);

router.get('/search',
    apiLimiter,
    asyncHandler(jobController.searchOffers)
);

router.get('/:id',
    apiLimiter,
    asyncHandler(jobController.getOfferById)
);

// Routes protégées pour création
router.post('/',
    apiLimiter,
    createLimiter,
    validateJobOffer,
    asyncHandler(jobController.createOffer)
);

// Routes admin seulement
router.put('/:id/status',
    authenticateToken,
    isAdmin,
    asyncHandler(jobController.updateOfferStatus)
);

router.delete('/:id',
    authenticateToken,
    isAdmin,
    asyncHandler(jobController.deleteOffer)
);

router.get('/stats/overview',
    authenticateToken,
    isAdmin,
    asyncHandler(jobController.getOffersStats)
);

// Route pour upload de fichier (optionnelle)
router.post('/:id/upload',
    authenticateToken,
    isAdmin,
    uploadJobOffer,
    validateUpload,
    asyncHandler((req, res) => {
        // Gérer l'upload de fichier pour l'offre
        res.json({
            message: 'Fichier uploadé avec succès',
            file: req.file
        });
    })
);

module.exports = router;