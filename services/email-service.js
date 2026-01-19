// ===============================================
// FONCTIONS EMAIL
// ===============================================

const { transporter } = require('../config/email');
require('dotenv').config();

function sendWelcomeEmail(email, firstName) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🎓 Bienvenue à l\'Université !',
        html: `
            <h1>Bienvenue ${firstName} !</h1>
            <p>Votre compte a été créé avec succès.</p>
            <p>Vous pouvez maintenant accéder à tous nos services.</p>
            <br>
            <p>L'équipe Universitaire</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log('Erreur envoi email:', error);
        else console.log('Email envoyé:', info.response);
    });
}

function sendContactConfirmation(email, firstName, subject) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '✅ Message reçu - ' + subject,
        html: `
            <h2>Bonjour ${firstName},</h2>
            <p>Nous avons bien reçu votre message concernant : <strong>${subject}</strong></p>
            <p>Notre équipe vous répondra dans les 24 heures.</p>
            <br>
            <p>Cordialement,<br>L'équipe Universitaire</p>
        `
    };

    transporter.sendMail(mailOptions);
}

function sendAdminNotification(email, firstName, lastName, subject, message) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: '📩 Nouveau message contact',
        html: `
            <h2>Nouveau message reçu</h2>
            <p><strong>De:</strong> ${firstName} ${lastName} (${email})</p>
            <p><strong>Sujet:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `
    };

    transporter.sendMail(mailOptions);
}

function sendApplicationConfirmation(email, school, program) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🎓 Candidature reçue',
        html: `
            <h2>Candidature enregistrée</h2>
            <p>Votre candidature pour <strong>${program}</strong> à <strong>${school}</strong> a été reçue.</p>
            <p>Nous l'examinons et vous contacterons bientôt.</p>
            <br>
            <p>L'équipe des admissions</p>
        `
    };

    transporter.sendMail(mailOptions);
}

module.exports = {
    sendWelcomeEmail,
    sendContactConfirmation,
    sendAdminNotification,
    sendApplicationConfirmation
};