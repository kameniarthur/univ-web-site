const crypto = require('crypto');

class PaymentService {
    constructor() {
        this.currencies = {
            'EUR': '€',
            'USD': '$',
            'XAF': 'FCFA'
        };

        this.paymentMethods = {
            'card': 'Carte bancaire',
            'mobile': 'Mobile money',
            'bank_transfer': 'Virement bancaire',
            'cash': 'Espèces'
        };

        this.paymentTypes = {
            'frais_scolarite': {
                name: 'Frais de scolarité',
                description: 'Paiement des frais de scolarité',
                category: 'tuition'
            },
            'frais_dossier': {
                name: 'Frais de dossier',
                description: 'Frais de dossier d\'admission',
                category: 'admission'
            },
            'frais_diplome': {
                name: 'Frais de diplôme',
                description: 'Frais d\'édition et d\'envoi du diplôme',
                category: 'certificate'
            },
            'frais_bibliotheque': {
                name: 'Frais de bibliothèque',
                description: 'Abonnement annuel à la bibliothèque',
                category: 'library'
            },
            'autres': {
                name: 'Autres frais',
                description: 'Autres frais divers',
                category: 'other'
            }
        };
    }

    // Générer un ID de transaction unique
    generateTransactionId(prefix = 'TXN') {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex');
        return `${prefix}_${timestamp}_${random}`.toUpperCase();
    }

    // Générer une référence de paiement
    generatePaymentReference(userId, amount, type) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const hash = crypto.createHash('md5')
            .update(`${userId}${amount}${type}${Date.now()}`)
            .digest('hex')
            .slice(0, 8)
            .toUpperCase();

        return `PAY${year}${month}${day}${hash}`;
    }

    // Calculer les frais de transaction
    calculateTransactionFees(amount, method = 'card', currency = 'EUR') {
        const fees = {
            'card': {
                percentage: 1.8, // 1.8%
                fixed: 0.25,     // 0.25€
                min: 0.50,       // Minimum 0.50€
                max: 10.00       // Maximum 10.00€
            },
            'mobile': {
                percentage: 0.5,
                fixed: 0,
                min: 0.10,
                max: 5.00
            },
            'bank_transfer': {
                percentage: 0,
                fixed: 1.50,
                min: 1.50,
                max: 1.50
            },
            'cash': {
                percentage: 0,
                fixed: 0,
                min: 0,
                max: 0
            }
        };

        const feeConfig = fees[method] || fees.card;

        // Calculer les frais
        let fee = (amount * (feeConfig.percentage / 100)) + feeConfig.fixed;

        // Appliquer les limites
        fee = Math.max(fee, feeConfig.min);
        fee = Math.min(fee, feeConfig.max);

        // Arrondir à 2 décimales
        fee = Math.round(fee * 100) / 100;

        // Calculer le total
        const total = amount + fee;

        return {
            amount,
            fee,
            total,
            currency,
            method,
            feePercentage: feeConfig.percentage,
            feeFixed: feeConfig.fixed
        };
    }

    // Valider les informations de paiement
    validatePayment(data) {
        const errors = [];

        // Valider le montant
        if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
            errors.push('Montant invalide');
        }

        // Valider le type de paiement
        if (!data.payment_type || !this.paymentTypes[data.payment_type]) {
            errors.push('Type de paiement invalide');
        }

        // Valider la méthode de paiement
        if (data.payment_method && !this.paymentMethods[data.payment_method]) {
            errors.push('Méthode de paiement invalide');
        }

        // Valider la devise
        if (data.currency && !this.currencies[data.currency]) {
            errors.push('Devise non supportée');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Générer un reçu de paiement
    generateReceipt(paymentData) {
        const {
            userId,
            amount,
            payment_type,
            payment_method,
            transaction_id,
            reference,
            currency = 'EUR',
            student_name,
            student_email
        } = paymentData;

        const date = new Date();
        const paymentType = this.paymentTypes[payment_type] || this.paymentTypes.autres;
        const paymentMethod = this.paymentMethods[payment_method] || 'Non spécifié';
        const currencySymbol = this.currencies[currency] || currency;

        // Calculer les frais si non fournis
        const feeCalculation = paymentData.fee !== undefined
            ? { amount, fee: paymentData.fee, total: amount + paymentData.fee }
            : this.calculateTransactionFees(amount, payment_method, currency);

        return {
            receipt_number: reference || this.generatePaymentReference(userId, amount, payment_type),
            transaction_id: transaction_id || this.generateTransactionId(),
            date: date.toISOString(),
            date_formatted: date.toLocaleDateString('fr-FR'),
            time: date.toLocaleTimeString('fr-FR'),

            student: {
                id: userId,
                name: student_name,
                email: student_email
            },

            payment_details: {
                type: paymentType.name,
                description: paymentType.description,
                category: paymentType.category,
                method: paymentMethod
            },

            amounts: {
                subtotal: feeCalculation.amount,
                fee: feeCalculation.fee,
                total: feeCalculation.total,
                currency,
                currency_symbol: currencySymbol
            },

            status: paymentData.status || 'pending',
            notes: paymentData.notes || '',

            // Informations institutionnelles
            institution: {
                name: process.env.INSTITUTION_NAME || 'Université',
                address: process.env.INSTITUTION_ADDRESS || '',
                phone: process.env.INSTITUTION_PHONE || '',
                email: process.env.INSTITUTION_EMAIL || 'finances@universite.edu',
                website: process.env.INSTITUTION_WEBSITE || 'https://universite.edu',
                siret: process.env.INSTITUTION_SIRET || '',
                vat_number: process.env.INSTITUTION_VAT || ''
            }
        };
    }

    // Simuler un processus de paiement
    async processPayment(paymentData) {
        try {
            // Valider le paiement
            const validation = this.validatePayment(paymentData);
            if (!validation.valid) {
                throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
            }

            // Générer les identifiants
            const transactionId = this.generateTransactionId();
            const reference = this.generatePaymentReference(
                paymentData.userId,
                paymentData.amount,
                paymentData.payment_type
            );

            // Simuler un délai de traitement
            await this.simulateProcessingDelay();

            // Déterminer le statut (simulé)
            // En réalité, cela dépendrait de l'API du processeur de paiement
            const isSuccessful = Math.random() > 0.1; // 90% de succès pour la simulation

            const status = isSuccessful ? 'completed' : 'failed';
            const statusMessage = isSuccessful
                ? 'Paiement traité avec succès'
                : 'Échec du traitement du paiement';

            // Générer le reçu
            const receipt = this.generateReceipt({
                ...paymentData,
                transaction_id: transactionId,
                reference,
                status
            });

            return {
                success: isSuccessful,
                transactionId,
                reference,
                status,
                message: statusMessage,
                receipt,
                processedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Erreur traitement paiement:', error.message);
            return {
                success: false,
                error: error.message,
                transactionId: null,
                status: 'error',
                processedAt: new Date().toISOString()
            };
        }
    }

    // Simuler un délai de traitement
    async simulateProcessingDelay(min = 500, max = 2000) {
        const delay = Math.random() * (max - min) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Générer un QR code pour paiement mobile (texte seulement)
    generateMobilePaymentCode(paymentData, provider = 'orange_money') {
        const providers = {
            'orange_money': {
                format: '*144*{{amount}}*{{phone}}#',
                regex: /^\*144\*(\d+)\*(\d+)#$/
            },
            'mtn_money': {
                format: '*126*1*1*{{phone}}*{{amount}}#',
                regex: /^\*126\*1\*1\*(\d+)\*(\d+)#$/
            },
            'moov_money': {
                format: '*155*{{amount}}*{{phone}}#',
                regex: /^\*155\*(\d+)\*(\d+)#$/
            }
        };

        const config = providers[provider] || providers.orange_money;
        const amount = Math.round(paymentData.amount);
        const phone = paymentData.phone || '';

        if (!phone) {
            throw new Error('Numéro de téléphone requis pour le paiement mobile');
        }

        const code = config.format
            .replace('{{amount}}', amount)
            .replace('{{phone}}', phone);

        return {
            provider,
            code,
            amount,
            phone,
            instructions: `Composez ${code} sur votre téléphone pour effectuer le paiement`
        };
    }

    // Générer un lien de paiement en ligne (simulé)
    generatePaymentLink(paymentData, gateway = 'stripe') {
        const gateways = {
            'stripe': `https://checkout.stripe.com/pay/${this.generateTransactionId('STRIPE')}`,
            'paypal': `https://www.paypal.com/checkoutnow/${this.generateTransactionId('PAYPAL')}`,
            'paytech': `https://paytech.sn/payment/${this.generateTransactionId('PAYTECH')}`
        };

        const link = gateways[gateway] || gateways.stripe;

        return {
            gateway,
            link,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expire dans 24h
            qr_code_data: link // Pour générer un QR code côté client
        };
    }

    // Vérifier le statut d'un paiement
    async checkPaymentStatus(transactionId) {
        // Simulation - en réalité, appeler l'API du processeur
        await this.simulateProcessingDelay(100, 500);

        const statuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        return {
            transactionId,
            status: randomStatus,
            checked_at: new Date().toISOString(),
            details: `Statut simulé: ${randomStatus}`
        };
    }

    // Générer des statistiques de paiement
    generatePaymentStats(payments) {
        if (!payments || payments.length === 0) {
            return {
                total: 0,
                average: 0,
                byType: {},
                byMethod: {},
                byStatus: {},
                monthly: {}
            };
        }

        const stats = {
            total: 0,
            average: 0,
            byType: {},
            byMethod: {},
            byStatus: {},
            monthly: {},
            successful: 0,
            failed: 0,
            pending: 0
        };

        payments.forEach(payment => {
            // Total
            stats.total += parseFloat(payment.amount);

            // Par type
            if (!stats.byType[payment.payment_type]) {
                stats.byType[payment.payment_type] = {
                    count: 0,
                    amount: 0
                };
            }
            stats.byType[payment.payment_type].count++;
            stats.byType[payment.payment_type].amount += parseFloat(payment.amount);

            // Par méthode
            if (payment.payment_method) {
                if (!stats.byMethod[payment.payment_method]) {
                    stats.byMethod[payment.payment_method] = {
                        count: 0,
                        amount: 0
                    };
                }
                stats.byMethod[payment.payment_method].count++;
                stats.byMethod[payment.payment_method].amount += parseFloat(payment.amount);
            }

            // Par statut
            if (!stats.byStatus[payment.status]) {
                stats.byStatus[payment.status] = {
                    count: 0,
                    amount: 0
                };
            }
            stats.byStatus[payment.status].count++;
            stats.byStatus[payment.status].amount += parseFloat(payment.amount);

            // Compter les statuts
            if (payment.status === 'completed') stats.successful++;
            else if (payment.status === 'failed') stats.failed++;
            else if (payment.status === 'pending') stats.pending++;

            // Par mois
            const date = new Date(payment.created_at);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

            if (!stats.monthly[monthKey]) {
                stats.monthly[monthKey] = {
                    count: 0,
                    amount: 0
                };
            }
            stats.monthly[monthKey].count++;
            stats.monthly[monthKey].amount += parseFloat(payment.amount);
        });

        // Calculer la moyenne
        stats.average = stats.total / payments.length;

        return stats;
    }
}

module.exports = new PaymentService();