// Importation des modules nécessaires pour la validation
import { body, param, query, validationResult } from 'express-validator';
import { isValidObjectId } from 'mongoose';

/**
 * Middleware pour gérer les erreurs de validation
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @param {Function} next - Fonction pour passer au middleware suivant
 */
const gererErreursValidation = (req, res, next) => {
    const erreurs = validationResult(req);

    if (!erreurs.isEmpty()) {
        const messagesErreur = erreurs.array().map(erreur => ({
            champ: erreur.param,
            message: erreur.msg,
            valeur: erreur.value,
        }));
        return res.status(400).json({
            succes: false,
            erreur: 'Données de validation invalides',
            details: messagesErreur,
        });
    }
    next();
};

/**
 * Validation des ObjectId MongoDB
 * @param {String} paramName - Nom du paramètre à valider
 * @returns {Array} Tableau de middlewares express-validator
 */
const validerObjectId = paramName => {
    return [
        param(paramName).custom(valeur => {
            if (!isValidObjectId(valeur)) {
                throw new Error('ID invalide');
            }
            return true;
        }),
        gererErreursValidation,
    ];
};

// Validations pour l'authentification
const validerConnexion = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Veuillez fournir un email valide'),
    body('motDePasse')
        .isLength({ min: 6 })
        .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    gererErreursValidation,
];

// Validations pour l'inscription
const validerInscription = [
    body('prenom')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
    body('nom')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Veuillez fournir un email valide'),
    body('motDePasse')
        .isLength({ min: 6 })
        .withMessage('Le mot de passe doit contenir au moins 6 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage(
            'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
        ),
    gererErreursValidation,
];

// Validations pour les produits
const validerProduit = [
    body('nom')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage(
            'Le nom du produit doit contenir entre 3 et 200 caractères'
        ),
    body('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage(
            'La description doit contenir entre 10 et 2000 caractères'
        ),
    body('prix')
        .isFloat({ min: 0 })
        .withMessage('Le prix doit être un nombre positif'),
    body('quantite')
        .isInt({ min: 0 })
        .withMessage('La quantité doit être un entier positif'),
    body('categorie').isMongoId().withMessage('Catégorie invalide'),
    gererErreursValidation,
];

// Validations pour les commandes
const validerCommande = [
    body('articles')
        .isArray({ min: 1 })
        .withMessage('La commande doit contenir au moins un article'),
    body('articles.*.produit')
        .isMongoId()
        .withMessage('ID de produit invalide'),
    body('articles.*.quantite')
        .isInt({ min: 1 })
        .withMessage('La quantité doit être au moins 1'),
    body('adresseLivraison.prenom')
        .trim()
        .notEmpty()
        .withMessage('Le prénom est requis'),
    body('adresseLivraison.nom')
        .trim()
        .notEmpty()
        .withMessage('Le nom est requis'),
    body('adresseLivraison.rue')
        .trim()
        .notEmpty()
        .withMessage('La rue est requise'),
    body('adresseLivraison.ville')
        .trim()
        .notEmpty()
        .withMessage('La ville est requise'),
    body('adresseLivraison.pays')
        .trim()
        .notEmpty()
        .withMessage('Le pays est requis'),
    body('adresseLivraison.codePostal')
        .trim()
        .notEmpty()
        .withMessage('Le code postal est requis'),
    gererErreursValidation,
];

// Validations pour les requêtes de pagination
const validerPagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Le numéro de page doit être un entier positif'),
    query('limite')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('La limite doit être entre 1 et 100'),
    query('tri')
        .optional()
        .isString()
        .withMessage('Le champ de tri doit être une chaîne'),
    gererErreursValidation,
];

// Exportation des validations
export {
    gererErreursValidation,
    validerObjectId,
    validerConnexion,
    validerInscription,
    validerProduit,
    validerCommande,
    validerPagination,
};
