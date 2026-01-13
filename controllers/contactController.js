const ContactMessage = require('../models/ContactMessage');
const emailService = require('../services/emailService');

class ContactController {
    async createMessage(req, res) {
        try {
            const { first_name, last_name, email, phone, school, subject, message } = req.body;

            if (!first_name || !last_name || !email || !subject || !message) {
                return res.status(400).json({ error: 'Champs obligatoires manquants' });
            }

            const newMessage = await ContactMessage.create({
                first_name,
                last_name,
                email,
                phone,
                school,
                subject,
                message
            });

            emailService.sendContactConfirmation(email, first_name, subject);
            emailService.sendAdminNotification(email, first_name, last_name, subject, message);

            res.status(201).json({
                message: 'Message envoyé avec succès',
                messageId: newMessage.id,
                data: newMessage
            });
        } catch (error) {
            console.error('Erreur création message:', error);
            res.status(500).json({ error: 'Erreur serveur lors de l\'envoi du message' });
        }
    }

    async getAllMessages(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const { limit = 100, offset = 0, status } = req.query;
            const messages = await ContactMessage.findAll({
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const total = await ContactMessage.count();

            res.json({
                messages,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total
                }
            });
        } catch (error) {
            console.error('Erreur récupération messages:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getMessageById(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const messageId = req.params.id;
            const message = await ContactMessage.findById(messageId);

            if (!message) {
                return res.status(404).json({ error: 'Message non trouvé' });
            }

            res.json(message);
        } catch (error) {
            console.error('Erreur récupération message:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async updateMessageStatus(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const messageId = req.params.id;
            const { status } = req.body;

            if (!['nouveau', 'en_cours', 'traité', 'archivé'].includes(status)) {
                return res.status(400).json({ error: 'Statut invalide' });
            }

            const updatedMessage = await ContactMessage.updateStatus(messageId, status);

            res.json({
                message: 'Statut du message mis à jour',
                data: updatedMessage
            });
        } catch (error) {
            console.error('Erreur mise à jour message:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async deleteMessage(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const messageId = req.params.id;
            const deletedMessage = await ContactMessage.delete(messageId);

            if (!deletedMessage) {
                return res.status(404).json({ error: 'Message non trouvé' });
            }

            res.json({
                message: 'Message supprimé avec succès',
                messageId: deletedMessage.id
            });
        } catch (error) {
            console.error('Erreur suppression message:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getMessagesStats(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const messages = await ContactMessage.findAll(1000, 0);
            const total = await ContactMessage.count();

            const stats = {
                total,
                byStatus: {},
                bySubject: {},
                last7Days: 0
            };

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            messages.forEach(msg => {
                // Stats par statut
                stats.byStatus[msg.status] = (stats.byStatus[msg.status] || 0) + 1;

                // Stats par sujet (premiers mots)
                const subjectKey = msg.subject.split(' ').slice(0, 3).join(' ');
                stats.bySubject[subjectKey] = (stats.bySubject[subjectKey] || 0) + 1;

                // Messages des 7 derniers jours
                if (new Date(msg.created_at) >= sevenDaysAgo) {
                    stats.last7Days++;
                }
            });

            res.json(stats);
        } catch (error) {
            console.error('Erreur statistiques messages:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}

module.exports = new ContactController();