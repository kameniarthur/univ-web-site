const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { validateContact } = require('../middleware/validation');
const { contactLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// Routes publiques
router.post('/',
    apiLimiter,
    contactLimiter,
    validateContact,
    asyncHandler(contactController.createMessage)
);

// Routes protégées (admin seulement)
router.get('/messages',
    authenticateToken,
    isAdmin,
    asyncHandler(contactController.getAllMessages)
);

router.get('/messages/stats',
    authenticateToken,
    isAdmin,
    asyncHandler(contactController.getMessagesStats)
);

router.get('/messages/:id',
    authenticateToken,
    isAdmin,
    asyncHandler(contactController.getMessageById)
);

router.put('/messages/:id/status',
    authenticateToken,
    isAdmin,
    asyncHandler(contactController.updateMessageStatus)
);

router.delete('/messages/:id',
    authenticateToken,
    isAdmin,
    asyncHandler(contactController.deleteMessage)
);

module.exports = router;