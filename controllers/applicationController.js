const Application = require('../models/Application');
const emailService = require('../services/emailService');

class ApplicationController {
    async createApplication(req, res) {
        try {
            const { school, program, education_level, motivation, cv_path } = req.body;
            const userId = req.user.id;

            if (!school || !program || !education_level) {
                return res.status(400).json({ error: 'Champs obligatoires manquants' });
            }

            const newApplication = await Application.create({
                user_id: userId,
                school,
                program,
                education_level,
                motivation,
                cv_path
            });

            emailService.sendApplicationConfirmation(req.user.email, school, program);

            res.status(201).json({
                message: 'Candidature envoyée avec succès',
                applicationId: newApplication.id,
                data: newApplication
            });
        } catch (error) {
            console.error('Erreur création candidature:', error);
            res.status(500).json({ error: 'Erreur serveur lors de l\'envoi de la candidature' });
        }
    }

    async getMyApplications(req, res) {
        try {
            const userId = req.user.id;
            const applications = await Application.findByUserId(userId);

            const total = await Application.countByUser(userId);

            res.json({
                applications,
                total
            });
        } catch (error) {
            console.error('Erreur récupération candidatures:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getAllApplications(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const { status, school, program, limit = 100, offset = 0 } = req.query;

            const applications = await Application.findAll({
                status,
                school,
                program,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                applications,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: applications.length
                }
            });
        } catch (error) {
            console.error('Erreur récupération candidatures:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getApplicationById(req, res) {
        try {
            const applicationId = req.params.id;
            const application = await Application.findById(applicationId);

            if (!application) {
                return res.status(404).json({ error: 'Candidature non trouvée' });
            }

            // Vérifier que l'utilisateur a accès à cette candidature
            if (req.user.role !== 'admin' && application.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }

            res.json(application);
        } catch (error) {
            console.error('Erreur récupération candidature:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async updateApplicationStatus(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const applicationId = req.params.id;
            const { status } = req.body;

            if (!['en_cours', 'examinée', 'acceptée', 'refusée'].includes(status)) {
                return res.status(400).json({ error: 'Statut invalide' });
            }

            const updatedApplication = await Application.updateStatus(applicationId, status);

            res.json({
                message: 'Statut de la candidature mis à jour',
                data: updatedApplication
            });
        } catch (error) {
            console.error('Erreur mise à jour candidature:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async updateApplication(req, res) {
        try {
            const applicationId = req.params.id;
            const { school, program, education_level, motivation, cv_path } = req.body;

            const application = await Application.findById(applicationId);
            if (!application) {
                return res.status(404).json({ error: 'Candidature non trouvée' });
            }

            if (req.user.role !== 'admin' && application.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }

            const updatedApplication = await Application.update(applicationId, {
                school,
                program,
                education_level,
                motivation,
                cv_path
            });

            res.json({
                message: 'Candidature mise à jour avec succès',
                data: updatedApplication
            });
        } catch (error) {
            console.error('Erreur mise à jour candidature:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async deleteApplication(req, res) {
        try {
            const applicationId = req.params.id;
            const application = await Application.findById(applicationId);

            if (!application) {
                return res.status(404).json({ error: 'Candidature non trouvée' });
            }

            if (req.user.role !== 'admin' && application.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }

            const deletedApplication = await Application.delete(applicationId);

            res.json({
                message: 'Candidature supprimée avec succès',
                applicationId: deletedApplication.id
            });
        } catch (error) {
            console.error('Erreur suppression candidature:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getApplicationsStats(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const [total, byStatus] = await Promise.all([
                Application.countByStatus('en_cours'),
                Application.countByStatus()
            ]);

            const applications = await Application.findAll({ limit: 1000 });
            const stats = {
                total,
                byStatus: {},
                bySchool: {},
                byProgram: {},
                last30Days: 0
            };

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            applications.forEach(app => {
                // Stats par statut
                stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1;

                // Stats par école
                stats.bySchool[app.school] = (stats.bySchool[app.school] || 0) + 1;

                // Stats par programme
                stats.byProgram[app.program] = (stats.byProgram[app.program] || 0) + 1;

                // Candidatures des 30 derniers jours
                if (new Date(app.created_at) >= thirtyDaysAgo) {
                    stats.last30Days++;
                }
            });

            res.json(stats);
        } catch (error) {
            console.error('Erreur statistiques candidatures:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}

module.exports = new ApplicationController();