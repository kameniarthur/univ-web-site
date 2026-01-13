/**
 * Middleware de validation des données
 */

// Validation des données utilisateur
function validateUser(req, res, next) {
    const { email, password, first_name, last_name } = req.body;

    const errors = [];

    // Validation email
    if (email && !isValidEmail(email)) {
        errors.push('Email invalide');
    }

    // Validation mot de passe
    if (password && !isValidPassword(password)) {
        errors.push('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    // Validation nom et prénom
    if (first_name && !isValidName(first_name)) {
        errors.push('Prénom invalide');
    }

    if (last_name && !isValidName(last_name)) {
        errors.push('Nom invalide');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation échouée',
            details: errors
        });
    }

    next();
}

// Validation des données de contact
function validateContact(req, res, next) {
    const { email, first_name, last_name, subject, message } = req.body;

    const errors = [];

    if (!email || !isValidEmail(email)) {
        errors.push('Email invalide ou manquant');
    }

    if (!first_name || !isValidName(first_name)) {
        errors.push('Prénom invalide ou manquant');
    }

    if (!last_name || !isValidName(last_name)) {
        errors.push('Nom invalide ou manquant');
    }

    if (!subject || subject.length < 3) {
        errors.push('Sujet trop court (minimum 3 caractères)');
    }

    if (!message || message.length < 10) {
        errors.push('Message trop court (minimum 10 caractères)');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation échouée',
            details: errors
        });
    }

    next();
}

// Validation des offres d'emploi
function validateJobOffer(req, res, next) {
    const { type, company, contact_person, email, missions } = req.body;

    const errors = [];

    if (!type || !['emploi', 'stage'].includes(type)) {
        errors.push('Type d\'offre invalide (doit être "emploi" ou "stage")');
    }

    if (!company || company.length < 2) {
        errors.push('Nom de l\'entreprise invalide');
    }

    if (!contact_person || contact_person.length < 2) {
        errors.push('Nom du contact invalide');
    }

    if (!email || !isValidEmail(email)) {
        errors.push('Email de contact invalide');
    }

    if (!missions || missions.length < 10) {
        errors.push('Description des missions trop courte');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation échouée',
            details: errors
        });
    }

    next();
}

// Validation des candidatures
function validateApplication(req, res, next) {
    const { school, program, education_level, motivation } = req.body;

    const errors = [];

    if (!school || school.length < 2) {
        errors.push('Nom de l\'établissement invalide');
    }

    if (!program || program.length < 2) {
        errors.push('Nom du programme invalide');
    }

    if (!education_level || !['bac', 'bac+2', 'bac+3', 'bac+5', 'doctorat'].includes(education_level)) {
        errors.push('Niveau d\'études invalide');
    }

    if (!motivation || motivation.length < 50) {
        errors.push('Lettre de motivation trop courte (minimum 50 caractères)');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation échouée',
            details: errors
        });
    }

    next();
}

// Validation des paiements
function validatePayment(req, res, next) {
    const { amount, payment_type } = req.body;

    const errors = [];

    if (!amount || isNaN(amount) || amount <= 0) {
        errors.push('Montant invalide');
    }

    if (!payment_type || !['frais_scolarite', 'frais_dossier', 'autres'].includes(payment_type)) {
        errors.push('Type de paiement invalide');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation échouée',
            details: errors
        });
    }

    next();
}

// Validation des événements
function validateEvent(req, res, next) {
    const { title, event_date, location } = req.body;

    const errors = [];

    if (!title || title.length < 3) {
        errors.push('Titre trop court (minimum 3 caractères)');
    }

    if (!event_date || isNaN(Date.parse(event_date))) {
        errors.push('Date de l\'événement invalide');
    }

    if (!location || location.length < 3) {
        errors.push('Lieu trop court (minimum 3 caractères)');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation échouée',
            details: errors
        });
    }

    next();
}

// Fonctions utilitaires de validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

function isValidName(name) {
    return name && name.length >= 2 && /^[a-zA-ZÀ-ÿ\s\-']+$/.test(name);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9\s\-\+\(\)]{10,15}$/;
    return phoneRegex.test(phone);
}

module.exports = {
    validateUser,
    validateContact,
    validateJobOffer,
    validateApplication,
    validatePayment,
    validateEvent,
    isValidEmail,
    isValidPassword,
    isValidName,
    isValidPhone
};