const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validation');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// Routes publiques
router.get('/',
    apiLimiter,
    asyncHandler(eventController.getAllEvents)
);

router.get('/upcoming',
    apiLimiter,
    asyncHandler(eventController.getUpcomingEvents)
);

router.get('/past',
    apiLimiter,
    asyncHandler(eventController.getPastEvents)
);

router.get('/search',
    apiLimiter,
    asyncHandler(eventController.searchEvents)
);

router.get('/date-range',
    apiLimiter,
    asyncHandler(eventController.getEventsByDateRange)
);

router.get('/:id',
    apiLimiter,
    asyncHandler(eventController.getEventById)
);

// Routes protégées (admin seulement)
router.post('/',
    authenticateToken,
    isAdmin,
    createLimiter,
    validateEvent,
    asyncHandler(eventController.createEvent)
);

router.put('/:id',
    authenticateToken,
    isAdmin,
    asyncHandler(eventController.updateEvent)
);

router.delete('/:id',
    authenticateToken,
    isAdmin,
    asyncHandler(eventController.deleteEvent)
);

router.get('/stats/overview',
    authenticateToken,
    isAdmin,
    asyncHandler(eventController.getEventsStats)
);

module.exports = router;