const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        this.templates = {
            welcome: this.welcomeTemplate,
            contact: this.contactTemplate,
            application: this.applicationTemplate,
            payment: this.paymentTemplate,
            notification: this.notificationTemplate
        };
    }

    // Template d'email de bienvenue
    welcomeTemplate(firstName) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 32px;">🎓 Bienvenue à l'Université !</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2>Bonjour ${firstName},</h2>
                    <p>Votre compte a été créé avec succès sur notre plateforme universitaire.</p>
                    <p>Vous pouvez maintenant accéder à tous nos services :</p>
                    <ul>
                        <li>📋 Gestion des candidatures</li>
                        <li>📄 Demande de documents</li>
                        <li>💳 Paiement en ligne</li>
                        <li>📅 Consultation des événements</li>
                        <li>💼 Offres d'emploi/stage</li>
                    </ul>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" 
                           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Accéder à mon compte
                        </a>
                    </div>
                    <p>Si vous avez des questions, n'hésitez pas à contacter notre support.</p>
                    <p>Cordialement,<br>L'équipe Universitaire</p>
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f0f0f0; color: #666; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} Université. Tous droits réservés.</p>
                    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                </div>
            </div>
        `;
    }

    // Template de confirmation de contact
    contactTemplate(firstName, subject) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 32px;">✅ Message reçu</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2>Bonjour ${firstName},</h2>
                    <p>Nous avons bien reçu votre message concernant :</p>
                    <div style="background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                        <strong>Sujet :</strong> ${subject}
                    </div>
                    <p>Notre équipe examine votre demande et vous répondra dans les plus brefs délais (généralement sous 24h).</p>
                    <p>En attendant, vous pouvez consulter notre <a href="${process.env.APP_URL || 'http://localhost:3000'}/faq">FAQ</a> pour des réponses rapides.</p>
                    <p>Cordialement,<br>L'équipe du support universitaire</p>
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f0f0f0; color: #666; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} Université. Tous droits réservés.</p>
                    <p>Numéro de référence : ${Date.now()}</p>
                </div>
            </div>
        `;
    }

    // Template de confirmation de candidature
    applicationTemplate(school, program) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 32px;">📨 Candidature enregistrée</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2>Candidature confirmée</h2>
                    <p>Votre candidature a été reçue avec succès.</p>
                    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
                        <p><strong>Établissement :</strong> ${school}</p>
                        <p><strong>Programme :</strong> ${program}</p>
                        <p><strong>Date de soumission :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                        <p><strong>Numéro de dossier :</strong> APP-${Date.now().toString().slice(-8)}</p>
                    </div>
                    <p><strong>Prochaines étapes :</strong></p>
                    <ol>
                        <li>Examen de votre dossier par notre commission</li>
                        <li>Vous recevrez une réponse sous 15 jours</li>
                        <li>Entretien éventuel (selon les programmes)</li>
                    </ol>
                    <p>Vous pouvez suivre l'état de votre candidature depuis votre espace personnel.</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}/applications" 
                           style="background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Suivre ma candidature
                        </a>
                    </div>
                    <p>Bonne chance !<br>L'équipe des admissions</p>
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f0f0f0; color: #666; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} Université. Service des admissions.</p>
                </div>
            </div>
        `;
    }

    // Template de confirmation de paiement
    paymentTemplate(amount, transactionId, paymentType) {
        const typeLabels = {
            'frais_scolarite': 'Frais de scolarité',
            'frais_dossier': 'Frais de dossier',
            'autres': 'Autres frais'
        };

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 32px;">💳 Paiement confirmé</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2>Reçu de paiement</h2>
                    <p>Votre paiement a été traité avec succès.</p>
                    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
                        <table style="width: 100%;">
                            <tr>
                                <td><strong>Montant :</strong></td>
                                <td style="text-align: right;">${amount} €</td>
                            </tr>
                            <tr>
                                <td><strong>Type :</strong></td>
                                <td style="text-align: right;">${typeLabels[paymentType] || paymentType}</td>
                            </tr>
                            <tr>
                                <td><strong>Transaction :</strong></td>
                                <td style="text-align: right;">${transactionId}</td>
                            </tr>
                            <tr>
                                <td><strong>Date :</strong></td>
                                <td style="text-align: right;">${new Date().toLocaleDateString('fr-FR')}</td>
                            </tr>
                            <tr>
                                <td><strong>Statut :</strong></td>
                                <td style="text-align: right; color: #4CAF50; font-weight: bold;">COMPLÉTÉ</td>
                            </tr>
                        </table>
                    </div>
                    <p><strong>Ce reçu fait office de justificatif de paiement.</strong></p>
                    <p>Vous pouvez le télécharger depuis votre espace personnel dans la section "Mes paiements".</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}/payments" 
                           style="background: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Voir mes paiements
                        </a>
                    </div>
                    <p>Merci pour votre confiance,<br>Le service financier</p>
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f0f0f0; color: #666; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} Université. Service financier.</p>
                    <p>Pour toute question concernant ce paiement, contactez : finances@universite.edu</p>
                </div>
            </div>
        `;
    }

    // Template de notification admin
    notificationTemplate(type, data) {
        const templates = {
            'new_contact': `
                <h3>📩 Nouveau message de contact</h3>
                <p><strong>De :</strong> ${data.first_name} ${data.last_name}</p>
                <p><strong>Email :</strong> ${data.email}</p>
                <p><strong>Sujet :</strong> ${data.subject}</p>
                <p><strong>Message :</strong><br>${data.message}</p>
                <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/messages/${data.id}">Voir le message</a></p>
            `,
            'new_application': `
                <h3>📋 Nouvelle candidature</h3>
                <p><strong>Étudiant :</strong> ${data.student_name}</p>
                <p><strong>Programme :</strong> ${data.program}</p>
                <p><strong>Établissement :</strong> ${data.school}</p>
                <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/applications/${data.id}">Voir la candidature</a></p>
            `,
            'new_document_request': `
                <h3>📄 Nouvelle demande de document</h3>
                <p><strong>Étudiant :</strong> ${data.student_name}</p>
                <p><strong>Type de document :</strong> ${data.document_type}</p>
                <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/documents/${data.id}">Traiter la demande</a></p>
            `,
            'new_payment': `
                <h3>💳 Nouveau paiement</h3>
                <p><strong>Étudiant :</strong> ${data.student_name}</p>
                <p><strong>Montant :</strong> ${data.amount} €</p>
                <p><strong>Type :</strong> ${data.payment_type}</p>
                <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/payments/${data.id}">Voir le paiement</a></p>
            `
        };

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #333; padding: 20px; text-align: center; color: white;">
                    <h2 style="margin: 0;">🔔 Notification Administrateur</h2>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    ${templates[type] || `<p>Nouvelle notification : ${JSON.stringify(data)}</p>`}
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666;">
                        Cette notification a été générée automatiquement par le système.
                        <br>Date : ${new Date().toLocaleString('fr-FR')}
                    </p>
                </div>
            </div>
        `;
    }

    // Méthodes d'envoi d'emails
    async sendWelcomeEmail(email, firstName) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: '🎓 Bienvenue à l\'Université !',
                html: this.templates.welcome(firstName)
            });
            console.log(`✅ Email de bienvenue envoyé à ${email}`);
        } catch (error) {
            console.error(`❌ Erreur envoi email bienvenue à ${email}:`, error.message);
        }
    }

    async sendContactConfirmation(email, firstName, subject) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: `✅ Message reçu - ${subject}`,
                html: this.templates.contact(firstName, subject)
            });
            console.log(`✅ Confirmation contact envoyée à ${email}`);
        } catch (error) {
            console.error(`❌ Erreur envoi confirmation contact à ${email}:`, error.message);
        }
    }

    async sendApplicationConfirmation(email, school, program) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: '📨 Candidature reçue',
                html: this.templates.application(school, program)
            });
            console.log(`✅ Confirmation candidature envoyée à ${email}`);
        } catch (error) {
            console.error(`❌ Erreur envoi confirmation candidature à ${email}:`, error.message);
        }
    }

    async sendPaymentConfirmation(email, amount, transactionId, paymentType) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: '💳 Confirmation de paiement',
                html: this.templates.payment(amount, transactionId, paymentType)
            });
            console.log(`✅ Confirmation paiement envoyée à ${email} - ${transactionId}`);
        } catch (error) {
            console.error(`❌ Erreur envoi confirmation paiement à ${email}:`, error.message);
        }
    }

    async sendAdminNotification(type, data) {
        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            if (!adminEmail) {
                console.warn('⚠️ ADMIN_EMAIL non configuré, notification non envoyée');
                return;
            }

            const subjects = {
                'new_contact': '📩 Nouveau message de contact',
                'new_application': '📋 Nouvelle candidature',
                'new_document_request': '📄 Nouvelle demande de document',
                'new_payment': '💳 Nouveau paiement'
            };

            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: adminEmail,
                subject: subjects[type] || '🔔 Nouvelle notification',
                html: this.templates.notification(type, data)
            });
            console.log(`✅ Notification admin envoyée (${type})`);
        } catch (error) {
            console.error(`❌ Erreur envoi notification admin:`, error.message);
        }
    }

    // Méthode générique pour envoyer un email
    async sendEmail(to, subject, html, from = null) {
        try {
            await this.transporter.sendMail({
                from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to,
                subject,
                html
            });
            console.log(`✅ Email envoyé à ${to}`);
            return true;
        } catch (error) {
            console.error(`❌ Erreur envoi email à ${to}:`, error.message);
            return false;
        }
    }

    // Vérifier la configuration email
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Configuration email vérifiée');
            return true;
        } catch (error) {
            console.error('❌ Erreur vérification configuration email:', error.message);
            return false;
        }
    }
}

// Singleton pattern pour éviter les multiples instances
module.exports = new EmailService();