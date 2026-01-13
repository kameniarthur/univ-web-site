const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const emailService = require('../services/emailService');

const SECRET_KEY = process.env.JWT_SECRET || 'votre_cle_secrete_ultra_securisee';

class AuthController {
    async register(req, res) {
        try {
            const { email, password, first_name, last_name, phone, school, program } = req.body;

            // Validation
            if (!email || !password || !first_name || !last_name) {
                return res.status(400).json({ error: 'Champs obligatoires manquants' });
            }

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'Email déjà utilisé' });
            }

            const user = await User.create({
                email,
                password,
                first_name,
                last_name,
                phone,
                school,
                program
            });

            emailService.sendWelcomeEmail(email, first_name);

            res.status(201).json({
                message: 'Compte créé avec succès',
                userId: user.id,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Erreur inscription:', error);
            res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email et mot de passe requis' });
            }

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                SECRET_KEY,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Connexion réussie',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    school: user.school,
                    program: user.program,
                    phone: user.phone
                }
            });
        } catch (error) {
            console.error('Erreur connexion:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
        }
    }

    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }

            res.json(user);
        } catch (error) {
            console.error('Erreur récupération profil:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { first_name, last_name, phone, school, program } = req.body;

            const updatedUser = await User.update(userId, {
                first_name,
                last_name,
                phone,
                school,
                program
            });

            res.json({
                message: 'Profil mis à jour avec succès',
                user: updatedUser
            });
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}

module.exports = new AuthController();