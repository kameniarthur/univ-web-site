const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');
const { createLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// Appliquer l'authentification sur toutes les routes
router.use(authenticateToken);

// Routes pour les étudiants
router.post('/',
    createLimiter,
    validatePayment,
    asyncHandler(paymentController.createPayment)
);

router.get('/my',
    apiLimiter,
    asyncHandler(paymentController.getMyPayments)
);

router.get('/my/:id',
    apiLimiter,
    asyncHandler(paymentController.getPaymentById)
);

router.get('/transaction/:transactionId',
    apiLimiter,
    asyncHandler(paymentController.getPaymentByTransactionId)
);

// Routes admin seulement
router.get('/all',
    isAdmin,
    apiLimiter,
    asyncHandler(paymentController.getAllPayments)
);

router.put('/:id/status',
    isAdmin,
    asyncHandler(paymentController.updatePaymentStatus)
);

router.get('/stats/overview',
    isAdmin,
    asyncHandler(paymentController.getPaymentsStats)
);

router.get('/stats/monthly/:year/:month',
    isAdmin,
    asyncHandler(async (req, res) => {
        const summary = await paymentController.getMonthlySummary(
            parseInt(req.params.year),
            parseInt(req.params.month)
        );
        res.json(summary);
    })
);

module.exports = router;