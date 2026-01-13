const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateUser } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// Routes publiques
router.post('/register',
    authLimiter,
    validateUser,
    asyncHandler(authController.register)
);

router.post('/login',
    authLimiter,
    asyncHandler(authController.login)
);

// Route protégée
router.get('/profile',
    asyncHandler(authController.getProfile)
);

router.put('/profile',
    asyncHandler(authController.updateProfile)
);

module.exports = router;