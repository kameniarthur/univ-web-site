const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { createLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadDocument, validateUpload } = require('../middleware/fileUpload');

// Appliquer l'authentification sur toutes les routes
router.use(authenticateToken);

// Routes pour les étudiants
router.post('/request',
    createLimiter,
    asyncHandler(documentController.requestDocument)
);

router.get('/my',
    apiLimiter,
    asyncHandler(documentController.getMyDocuments)
);

router.get('/my/:id',
    apiLimiter,
    asyncHandler(documentController.getDocumentById)
);

router.delete('/my/:id',
    asyncHandler(documentController.deleteDocument)
);

// Routes admin seulement
router.get('/all',
    isAdmin,
    apiLimiter,
    asyncHandler(documentController.getAllDocuments)
);

router.put('/:id/status',
    isAdmin,
    asyncHandler(documentController.updateDocumentStatus)
);

router.get('/stats/overview',
    isAdmin,
    asyncHandler(documentController.getDocumentsStats)
);

// Route pour upload de document (admin)
router.post('/:id/upload',
    isAdmin,
    uploadDocument,
    validateUpload,
    asyncHandler((req, res) => {
        res.json({
            message: 'Document uploadé avec succès',
            filePath: req.file.path
        });
    })
);

// Route pour télécharger un document
router.get('/:id/download',
    asyncHandler(async (req, res) => {
        const document = await documentController.getDocumentById(req, res, true);

        if (document && document.file_path) {
            res.download(document.file_path);
        } else {
            res.status(404).json({ error: 'Fichier non trouvé' });
        }
    })
);

module.exports = router;