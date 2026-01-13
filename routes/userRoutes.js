const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { userSpecificLimiter } = require('../middleware/rateLimiter');

// Appliquer l'authentification sur toutes les routes
router.use(authenticateToken);

// Routes admin seulement
router.get('/',
    isAdmin,
    userSpecificLimiter(50),
    asyncHandler(userController.getAllUsers)
);

router.get('/stats',
    isAdmin,
    asyncHandler(userController.getUsersStats)
);

router.get('/:id',
    isAdmin,
    asyncHandler(userController.getUserById)
);

router.put('/:id',
    isAdmin,
    asyncHandler(userController.updateUser)
);

router.delete('/:id',
    isAdmin,
    asyncHandler(userController.deleteUser)
);

module.exports = router;