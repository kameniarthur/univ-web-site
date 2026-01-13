const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateToken, isAdmin, isOwnerOrAdmin } = require('../middleware/auth');
const { validateApplication } = require('../middleware/validation');
const { createLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadCV, validateUpload } = require('../middleware/fileUpload');

// Appliquer l'authentification sur toutes les routes
router.use(authenticateToken);

// Routes pour les étudiants
router.post('/',
    createLimiter,
    validateApplication,
    asyncHandler(applicationController.createApplication)
);

router.get('/my',
    apiLimiter,
    asyncHandler(applicationController.getMyApplications)
);

router.get('/my/:id',
    apiLimiter,
    asyncHandler(applicationController.getApplicationById)
);

router.put('/my/:id',
    asyncHandler(applicationController.updateApplication)
);

router.delete('/my/:id',
    asyncHandler(applicationController.deleteApplication)
);

// Routes admin seulement
router.get('/all',
    isAdmin,
    apiLimiter,
    asyncHandler(applicationController.getAllApplications)
);

router.put('/:id/status',
    isAdmin,
    asyncHandler(applicationController.updateApplicationStatus)
);

router.get('/stats/overview',
    isAdmin,
    asyncHandler(applicationController.getApplicationsStats)
);

// Route pour upload de CV
router.post('/upload-cv',
    uploadCV,
    validateUpload,
    asyncHandler((req, res) => {
        res.json({
            message: 'CV uploadé avec succès',
            filePath: req.file.path,
            fileName: req.file.filename
        });
    })
);

module.exports = router;