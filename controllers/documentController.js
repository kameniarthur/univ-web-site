const Document = require('../models/Document');

class DocumentController {
    async requestDocument(req, res) {
        try {
            const { document_type } = req.body;
            const userId = req.user.id;

            if (!document_type) {
                return res.status(400).json({ error: 'Type de document requis' });
            }

            const newDocument = await Document.create({
                user_id: userId,
                document_type
            });

            res.status(201).json({
                message: 'Demande de document enregistrée',
                documentId: newDocument.id,
                data: newDocument
            });
        } catch (error) {
            console.error('Erreur demande document:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la demande de document' });
        }
    }

    async getMyDocuments(req, res) {
        try {
            const userId = req.user.id;
            const documents = await Document.findByUserId(userId);

            const total = await Document.countByUser(userId);

            res.json({
                documents,
                total
            });
        } catch (error) {
            console.error('Erreur récupération documents:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getAllDocuments(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const { status, document_type, limit = 100, offset = 0 } = req.query;

            const documents = await Document.findAll({
                status,
                document_type,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                documents,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: documents.length
                }
            });
        } catch (error) {
            console.error('Erreur récupération documents:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getDocumentById(req, res) {
        try {
            const documentId = req.params.id;
            const document = await Document.findById(documentId);

            if (!document) {
                return res.status(404).json({ error: 'Document non trouvé' });
            }

            if (req.user.role !== 'admin' && document.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }

            res.json(document);
        } catch (error) {
            console.error('Erreur récupération document:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async updateDocumentStatus(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const documentId = req.params.id;
            const { status, file_path } = req.body;

            if (!['en_attente', 'traitée', 'disponible', 'expirée'].includes(status)) {
                return res.status(400).json({ error: 'Statut invalide' });
            }

            const updatedDocument = await Document.updateStatus(documentId, status, file_path);

            res.json({
                message: 'Statut du document mis à jour',
                data: updatedDocument
            });
        } catch (error) {
            console.error('Erreur mise à jour document:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async deleteDocument(req, res) {
        try {
            const documentId = req.params.id;
            const document = await Document.findById(documentId);

            if (!document) {
                return res.status(404).json({ error: 'Document non trouvé' });
            }

            if (req.user.role !== 'admin' && document.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }

            const deletedDocument = await Document.delete(documentId);

            res.json({
                message: 'Document supprimé avec succès',
                documentId: deletedDocument.id
            });
        } catch (error) {
            console.error('Erreur suppression document:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getDocumentsStats(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const [byType, byStatus] = await Promise.all([
                Document.countByType(),
                Document.countByStatus()
            ]);

            const documents = await Document.findAll({ limit: 1000 });
            const stats = {
                byType: {},
                byStatus: {},
                pending: 0,
                completed: 0
            };

            documents.forEach(doc => {
                // Stats par type
                stats.byType[doc.document_type] = (stats.byType[doc.document_type] || 0) + 1;

                // Stats par statut
                stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;

                // Documents en attente
                if (doc.status === 'en_attente') {
                    stats.pending++;
                }

                // Documents traités
                if (doc.status === 'traitée' || doc.status === 'disponible') {
                    stats.completed++;
                }
            });

            res.json(stats);
        } catch (error) {
            console.error('Erreur statistiques documents:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}

module.exports = new DocumentController();