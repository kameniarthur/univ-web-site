const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Middleware de gestion des uploads de fichiers
 */

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = './public/uploads';

        // Déterminer le sous-dossier en fonction du type de fichier
        if (file.fieldname === 'cv') {
            uploadPath = './public/uploads/cvs';
        } else if (file.fieldname === 'document') {
            uploadPath = './public/uploads/documents';
        } else if (file.fieldname === 'job_offer') {
            uploadPath = './public/uploads/job-offers';
        } else if (file.fieldname === 'profile_image') {
            uploadPath = './public/uploads/profiles';
        }

        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const userId = req.user ? req.user.id : 'anonymous';
        const timestamp = Date.now();
        const originalName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname).toLowerCase();

        const safeName = originalName.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${userId}_${safeName}_${timestamp}${extension}`;

        cb(null, filename);
    }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif'
    };

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedTypes[file.mimetype] || !allowedExtensions.includes(extension)) {
        return cb(new Error('Type de fichier non autorisé'), false);
    }

    cb(null, true);
};

// Configuration Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 1 // 1 fichier à la fois
    }
});

// Middleware pour uploader un CV
const uploadCV = upload.single('cv');

// Middleware pour uploader un document
const uploadDocument = upload.single('document');

// Middleware pour uploader une offre d'emploi
const uploadJobOffer = upload.single('job_offer');

// Middleware pour uploader une image de profil
const uploadProfileImage = upload.single('profile_image');

// Middleware pour valider les fichiers uploadés
function validateUpload(req, res, next) {
    if (!req.file) {
        return res.status(400).json({
            error: 'Aucun fichier téléchargé',
            message: 'Veuillez sélectionner un fichier à uploader'
        });
    }

    // Vérifier la taille du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
        // Supprimer le fichier trop volumineux
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            error: 'Fichier trop volumineux',
            message: 'La taille maximale autorisée est de 5MB'
        });
    }

    // Vérifier l'extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
    const extension = path.extname(req.file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        // Supprimer le fichier avec extension invalide
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            error: 'Extension non autorisée',
            message: `Extensions autorisées: ${allowedExtensions.join(', ')}`
        });
    }

    next();
}

// Middleware pour nettoyer les fichiers temporaires en cas d'erreur
function cleanupUploads(err, req, res, next) {
    if (req.file && err) {
        // Supprimer le fichier en cas d'erreur
        fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) {
                console.error('Erreur suppression fichier:', unlinkErr);
            }
        });
    }
    next(err);
}

// Fonction pour supprimer un fichier
function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Erreur suppression fichier:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

module.exports = {
    uploadCV,
    uploadDocument,
    uploadJobOffer,
    uploadProfileImage,
    validateUpload,
    cleanupUploads,
    deleteFile
};