const Payment = require('../models/Payment');

class PaymentController {
    async createPayment(req, res) {
        try {
            const { amount, payment_type, payment_method } = req.body;
            const userId = req.user.id;

            if (!amount || !payment_type) {
                return res.status(400).json({ error: 'Montant et type de paiement requis' });
            }

            const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);

            const newPayment = await Payment.create({
                user_id: userId,
                amount: parseFloat(amount),
                payment_type,
                payment_method,
                transaction_id: transactionId,
                status: 'complete'
            });

            res.status(201).json({
                message: 'Paiement enregistré avec succès',
                paymentId: newPayment.id,
                transactionId,
                data: newPayment
            });
        } catch (error) {
            console.error('Erreur création paiement:', error);
            res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement du paiement' });
        }
    }

    async getMyPayments(req, res) {
        try {
            const userId = req.user.id;
            const payments = await Payment.findByUserId(userId);

            const totalAmount = await Payment.sumByUser(userId);

            res.json({
                payments,
                summary: {
                    totalAmount,
                    count: payments.length
                }
            });
        } catch (error) {
            console.error('Erreur récupération paiements:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getAllPayments(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const { status, payment_type, limit = 100, offset = 0 } = req.query;

            const payments = await Payment.findAll({
                status,
                payment_type,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                payments,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: payments.length
                }
            });
        } catch (error) {
            console.error('Erreur récupération paiements:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getPaymentById(req, res) {
        try {
            const paymentId = req.params.id;
            const payment = await Payment.findById(paymentId);

            if (!payment) {
                return res.status(404).json({ error: 'Paiement non trouvé' });
            }

            if (req.user.role !== 'admin' && payment.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }

            res.json(payment);
        } catch (error) {
            console.error('Erreur récupération paiement:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async updatePaymentStatus(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const paymentId = req.params.id;
            const { status } = req.body;

            if (!['en_attente', 'complete', 'échoué', 'remboursé'].includes(status)) {
                return res.status(400).json({ error: 'Statut invalide' });
            }

            const updatedPayment = await Payment.updateStatus(paymentId, status);

            res.json({
                message: 'Statut du paiement mis à jour',
                data: updatedPayment
            });
        } catch (error) {
            console.error('Erreur mise à jour paiement:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getPaymentByTransactionId(req, res) {
        try {
            const transactionId = req.params.transactionId;
            const payment = await Payment.findByTransactionId(transactionId);

            if (!payment) {
                return res.status(404).json({ error: 'Transaction non trouvée' });
            }

            if (req.user.role !== 'admin' && payment.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }

            res.json(payment);
        } catch (error) {
            console.error('Erreur récupération transaction:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getPaymentsStats(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const payments = await Payment.findAll({ limit: 1000 });
            const stats = {
                totalAmount: 0,
                totalCount: payments.length,
                byStatus: {},
                byPaymentType: {},
                byMonth: {}
            };

            payments.forEach(payment => {
                // Montant total
                if (payment.status === 'complete') {
                    stats.totalAmount += parseFloat(payment.amount);
                }

                // Stats par statut
                stats.byStatus[payment.status] = (stats.byStatus[payment.status] || 0) + 1;

                // Stats par type de paiement
                stats.byPaymentType[payment.payment_type] = (stats.byPaymentType[payment.payment_type] || 0) + 1;

                // Stats par mois
                const month = new Date(payment.created_at).toISOString().slice(0, 7);
                if (!stats.byMonth[month]) {
                    stats.byMonth[month] = {
                        count: 0,
                        amount: 0
                    };
                }
                stats.byMonth[month].count++;
                stats.byMonth[month].amount += parseFloat(payment.amount);
            });

            // Obtenir le résumé du mois en cours
            const currentMonth = new Date().toISOString().slice(0, 7);
            const monthlySummary = await Payment.getMonthlySummary(
                new Date().getFullYear(),
                new Date().getMonth() + 1
            );

            stats.currentMonth = monthlySummary;
            stats.monthlyAverage = stats.totalAmount / Object.keys(stats.byMonth).length;

            res.json(stats);
        } catch (error) {
            console.error('Erreur statistiques paiements:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}

module.exports = new PaymentController();