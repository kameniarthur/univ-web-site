const User = require('../models/User');

class UserController {
    async getAllUsers(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const { limit = 100, offset = 0 } = req.query;
            const users = await User.findAll(parseInt(limit), parseInt(offset));

            res.json({
                users,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: users.length
                }
            });
        } catch (error) {
            console.error('Erreur récupération utilisateurs:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getUserById(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const userId = req.params.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }

            res.json(user);
        } catch (error) {
            console.error('Erreur récupération utilisateur:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async updateUser(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const userId = req.params.id;
            const userData = req.body;

            const updatedUser = await User.update(userId, userData);

            res.json({
                message: 'Utilisateur mis à jour avec succès',
                user: updatedUser
            });
        } catch (error) {
            console.error('Erreur mise à jour utilisateur:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async deleteUser(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const userId = req.params.id;
            const deletedUser = await User.delete(userId);

            if (!deletedUser) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }

            res.json({
                message: 'Utilisateur supprimé avec succès',
                userId: deletedUser.id
            });
        } catch (error) {
            console.error('Erreur suppression utilisateur:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getUsersStats(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const users = await User.findAll(1000, 0);

            const stats = {
                total: users.length,
                byRole: {},
                bySchool: {},
                byProgram: {}
            };

            users.forEach(user => {
                // Stats par rôle
                stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;

                // Stats par école
                if (user.school) {
                    stats.bySchool[user.school] = (stats.bySchool[user.school] || 0) + 1;
                }

                // Stats par programme
                if (user.program) {
                    stats.byProgram[user.program] = (stats.byProgram[user.program] || 0) + 1;
                }
            });

            res.json(stats);
        } catch (error) {
            console.error('Erreur statistiques utilisateurs:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}

module.exports = new UserController();