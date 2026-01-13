const JobOffer = require('../models/JobOffer');
const emailService = require('../services/emailService');

class JobController {
    async createOffer(req, res) {
        try {
            const {
                type, company, contact_person, email, phone,
                address, city, postal_code, sector, missions, education_level
            } = req.body;

            if (!type || !company || !contact_person || !email) {
                return res.status(400).json({ error: 'Champs obligatoires manquants' });
            }

            const newOffer = await JobOffer.create({
                type,
                company,
                contact_person,
                email,
                phone,
                address,
                city,
                postal_code,
                sector,
                missions,
                education_level
            });

            res.status(201).json({
                message: 'Offre créée avec succès',
                offerId: newOffer.id,
                data: newOffer
            });
        } catch (error) {
            console.error('Erreur création offre:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la création de l\'offre' });
        }
    }

    async getAllOffers(req, res) {
        try {
            const { type, city, status = 'active', limit = 100, offset = 0 } = req.query;

            const offers = await JobOffer.findAll({
                type,
                city,
                status,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const total = await JobOffer.count();

            res.json({
                offers,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total
                }
            });
        } catch (error) {
            console.error('Erreur récupération offres:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getOfferById(req, res) {
        try {
            const offerId = req.params.id;
            const offer = await JobOffer.findById(offerId);

            if (!offer) {
                return res.status(404).json({ error: 'Offre non trouvée' });
            }

            res.json(offer);
        } catch (error) {
            console.error('Erreur récupération offre:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async updateOfferStatus(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const offerId = req.params.id;
            const { status } = req.body;

            if (!['en_attente', 'active', 'expirée', 'supprimée'].includes(status)) {
                return res.status(400).json({ error: 'Statut invalide' });
            }

            const updatedOffer = await JobOffer.updateStatus(offerId, status);

            res.json({
                message: 'Statut de l\'offre mis à jour',
                data: updatedOffer
            });
        } catch (error) {
            console.error('Erreur mise à jour offre:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async deleteOffer(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const offerId = req.params.id;
            const deletedOffer = await JobOffer.delete(offerId);

            if (!deletedOffer) {
                return res.status(404).json({ error: 'Offre non trouvée' });
            }

            res.json({
                message: 'Offre supprimée avec succès',
                offerId: deletedOffer.id
            });
        } catch (error) {
            console.error('Erreur suppression offre:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async searchOffers(req, res) {
        try {
            const { query, type, city, sector } = req.query;
            let offers = [];

            if (query) {
                offers = await JobOffer.findByCompany(query);
            } else {
                offers = await JobOffer.findAll({ type, city, sector });
            }

            res.json({
                offers,
                count: offers.length
            });
        } catch (error) {
            console.error('Erreur recherche offres:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getOffersStats(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const [total, byType] = await Promise.all([
                JobOffer.count(),
                JobOffer.countByType()
            ]);

            const offers = await JobOffer.findAll({ limit: 1000 });
            const stats = {
                total,
                byType: {},
                byCity: {},
                byStatus: {},
                recent: 0
            };

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            offers.forEach(offer => {
                // Stats par type
                stats.byType[offer.type] = (stats.byType[offer.type] || 0) + 1;

                // Stats par ville
                if (offer.city) {
                    stats.byCity[offer.city] = (stats.byCity[offer.city] || 0) + 1;
                }

                // Stats par statut
                stats.byStatus[offer.status] = (stats.byStatus[offer.status] || 0) + 1;

                // Offres récentes (30 derniers jours)
                if (new Date(offer.created_at) >= thirtyDaysAgo) {
                    stats.recent++;
                }
            });

            res.json(stats);
        } catch (error) {
            console.error('Erreur statistiques offres:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}

module.exports = new JobController();