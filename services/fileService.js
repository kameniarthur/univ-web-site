const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileService {
    constructor() {
        this.uploadDir = process.env.UPLOAD_PATH || './public/uploads';
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
        this.allowedTypes = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
        };

        // Initialiser les répertoires
        this.initDirectories();
    }

    // Initialiser les répertoires d'upload
    async initDirectories() {
        const directories = [
            this.uploadDir,
            path.join(this.uploadDir, 'cvs'),
            path.join(this.uploadDir, 'documents'),
            path.join(this.uploadDir, 'job-offers'),
            path.join(this.uploadDir, 'profiles'),
            path.join(this.uploadDir, 'temporary')
        ];

        for (const dir of directories) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ Répertoire créé: ${dir}`);
            }
        }
    }

    // Valider un fichier
    validateFile(file) {
        const errors = [];

        // Vérifier la taille
        if (file.size > this.maxFileSize) {
            errors.push(`Fichier trop volumineux (max: ${this.maxFileSize / 1024 / 1024}MB)`);
        }

        // Vérifier le type MIME
        if (!this.allowedTypes[file.mimetype]) {
            errors.push(`Type de fichier non autorisé: ${file.mimetype}`);
        }

        // Vérifier l'extension
        const extension = path.extname(file.originalname).toLowerCase().slice(1);
        const allowedExtensions = Object.values(this.allowedTypes);
        if (!allowedExtensions.includes(extension)) {
            errors.push(`Extension non autorisée: .${extension}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Générer un nom de fichier sécurisé
    generateFileName(originalName, userId, prefix = '') {
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(originalName).toLowerCase();
        const baseName = path.basename(originalName, extension)
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 50);

        return `${prefix}${userId}_${baseName}_${timestamp}_${randomString}${extension}`;
    }

    // Déterminer le répertoire de destination
    getDestinationDirectory(type) {
        const directories = {
            'cv': 'cvs',
            'document': 'documents',
            'job_offer': 'job-offers',
            'profile': 'profiles',
            'temporary': 'temporary'
        };

        return path.join(this.uploadDir, directories[type] || 'uploads');
    }

    // Sauvegarder un fichier
    async saveFile(file, userId, fileType = 'temporary') {
        try {
            // Valider le fichier
            const validation = this.validateFile(file);
            if (!validation.valid) {
                throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
            }

            // Préparer les informations
            const destDir = this.getDestinationDirectory(fileType);
            const fileName = this.generateFileName(file.originalname, userId, fileType);
            const filePath = path.join(destDir, fileName);
            const relativePath = filePath.replace(this.uploadDir, '').replace(/^[\\/]/, '');

            // S'assurer que le répertoire existe
            await fs.mkdir(destDir, { recursive: true });

            // Déplacer le fichier
            await fs.rename(file.path, filePath);

            // Retourner les informations du fichier
            return {
                success: true,
                fileName,
                filePath,
                relativePath: `/uploads/${relativePath}`,
                originalName: file.originalname,
                size: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date().toISOString()
            };
        } catch (error) {
            // Nettoyer en cas d'erreur
            await this.cleanupTempFile(file.path);
            throw error;
        }
    }

    // Supprimer un fichier
    async deleteFile(filePath) {
        try {
            // Convertir le chemin relatif en chemin absolu si nécessaire
            const absolutePath = filePath.startsWith(this.uploadDir)
                ? filePath
                : path.join(this.uploadDir, filePath.replace('/uploads/', ''));

            // Vérifier si le fichier existe
            await fs.access(absolutePath);

            // Supprimer le fichier
            await fs.unlink(absolutePath);

            console.log(`✅ Fichier supprimé: ${absolutePath}`);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`⚠️ Fichier non trouvé: ${filePath}`);
                return false;
            }
            console.error(`❌ Erreur suppression fichier ${filePath}:`, error.message);
            throw error;
        }
    }

    // Nettoyer les fichiers temporaires
    async cleanupTempFile(tempPath) {
        try {
            if (tempPath && fsSync.existsSync(tempPath)) {
                await fs.unlink(tempPath);
            }
        } catch (error) {
            console.warn(`⚠️ Impossible de nettoyer le fichier temporaire: ${tempPath}`);
        }
    }

    // Obtenir les informations d'un fichier
    async getFileInfo(filePath) {
        try {
            const absolutePath = filePath.startsWith(this.uploadDir)
                ? filePath
                : path.join(this.uploadDir, filePath.replace('/uploads/', ''));

            const stats = await fs.stat(absolutePath);
            const extension = path.extname(absolutePath).toLowerCase().slice(1);

            return {
                exists: true,
                path: absolutePath,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                extension,
                isDirectory: stats.isDirectory()
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return { exists: false };
            }
            throw error;
        }
    }

    // Lister les fichiers d'un répertoire
    async listFiles(directory, options = {}) {
        const {
            extensions = [],
            limit = 100,
            offset = 0
        } = options;

        try {
            const dirPath = path.join(this.uploadDir, directory);
            const files = await fs.readdir(dirPath);

            const filteredFiles = [];

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);

                if (stats.isFile()) {
                    const extension = path.extname(file).toLowerCase().slice(1);

                    if (extensions.length === 0 || extensions.includes(extension)) {
                        filteredFiles.push({
                            name: file,
                            path: filePath,
                            relativePath: `/uploads/${directory}/${file}`,
                            size: stats.size,
                            createdAt: stats.birthtime,
                            modifiedAt: stats.mtime,
                            extension
                        });
                    }
                }
            }

            // Trier par date de modification (plus récent d'abord)
            filteredFiles.sort((a, b) => b.modifiedAt - a.modifiedAt);

            // Pagination
            const paginatedFiles = filteredFiles.slice(offset, offset + limit);

            return {
                files: paginatedFiles,
                total: filteredFiles.length,
                limit,
                offset,
                hasMore: offset + limit < filteredFiles.length
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return { files: [], total: 0, limit, offset, hasMore: false };
            }
            throw error;
        }
    }

    // Compresser un fichier (exemple basique)
    async compressFile(inputPath, outputPath, quality = 80) {
        // Cette méthode nécessiterait une bibliothèque comme sharp pour les images
        // ou pdf-lib pour les PDFs
        console.warn('⚠️ Méthode compressFile non implémentée - nécessite des bibliothèques supplémentaires');
        return { success: false, message: 'Non implémenté' };
    }

    // Vérifier l'espace disque disponible
    async checkStorageSpace() {
        try {
            const stats = await fs.statfs(this.uploadDir);
            const total = stats.blocks * stats.bsize;
            const free = stats.bfree * stats.bsize;
            const used = total - free;

            return {
                total: this.formatBytes(total),
                free: this.formatBytes(free),
                used: this.formatBytes(used),
                percentage: ((used / total) * 100).toFixed(2)
            };
        } catch (error) {
            console.error('❌ Erreur vérification espace disque:', error.message);
            return null;
        }
    }

    // Formater les bytes en unités lisibles
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Nettoyer les fichiers anciens
    async cleanupOldFiles(days = 30, directory = 'temporary') {
        try {
            const dirPath = path.join(this.uploadDir, directory);
            const files = await fs.readdir(dirPath);
            const now = Date.now();
            const cutoff = now - (days * 24 * 60 * 60 * 1000);

            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);

                if (stats.isFile() && stats.mtime.getTime() < cutoff) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    console.log(`🧹 Fichier nettoyé: ${filePath}`);
                }
            }

            return {
                success: true,
                deletedCount,
                message: `Nettoyage terminé: ${deletedCount} fichier(s) supprimé(s)`
            };
        } catch (error) {
            console.error('❌ Erreur nettoyage fichiers:', error.message);
            return {
                success: false,
                deletedCount: 0,
                error: error.message
            };
        }
    }
}

module.exports = new FileService();