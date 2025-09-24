import dotenv from 'dotenv';

// Charge les variables d'environnement depuis le fichier .env
dotenv.config();

// Objet de configuration de l'application, centralisant toutes les variables
const config = {
    // --- Paramètres du serveur ---
    // Environnement de l'application (ex: 'development', 'production')
    nodeEnv: process.env.NODE_ENV || 'development',
    // Port d'écoute du serveur
    port: process.env.PORT || 5000,
    // URL de base du serveur
    serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
    // URL de l'application cliente (frontend)
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

    // --- Base de données (MongoDB) ---
    // URI de connexion à la base de données
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nody_db',

    // --- JSON Web Token (JWT) ---
    // Clé secrète pour la signature des tokens
    jwtSecret: process.env.JWT_SECRET,
    // Durée de validité des tokens (ex: '7d' pour 7 jours)
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    // Durée de vie du cookie JWT en jours
    jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,

    // --- Service d'envoi d'e-mails ---
    // Nom du service d'e-mail (ex: Gmail, SendGrid)
    emailService: process.env.EMAIL_SERVICE,
    // Port du serveur d'e-mail
    emailPort: process.env.EMAIL_PORT,
    // Nom d'utilisateur pour la connexion au service d'e-mail
    emailUser: process.env.EMAIL_USER,
    // Mot de passe pour la connexion
    emailPass: process.env.EMAIL_PASS,

    // --- Paiements (Stripe) ---
    // Clé publique d'API Stripe
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    // Clé secrète d'API Stripe
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,

    // --- Cache (Redis) ---
    // Hôte du serveur Redis
    redisHost: process.env.REDIS_HOST || 'localhost',
    // Port du serveur Redis
    redisPort: parseInt(process.env.REDIS_PORT) || 6379,
    // Mot de passe pour l'authentification Redis
    redisPassword: process.env.REDIS_PASSWORD,

    // --- Gestion des fichiers ---
    // Taille maximale des fichiers en octets (10 Mo par défaut)
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    // Chemin où les fichiers seront stockés
    uploadPath: process.env.UPLOAD_PATH || './uploads',

    // --- Limitation du débit (Rate Limiting) ---
    // Fenêtre de temps pour la limitation du débit en millisecondes (15 minutes par défaut)
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    // Nombre maximum de requêtes autorisées par fenêtre
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// --- Validation des variables critiques ---
// Vérifie si les variables d'environnement essentielles sont définies
if (!config.jwtSecret) {
    throw new Error(
        "La variable d'environnement JWT_SECRET doit être définie."
    );
}

if (!config.mongodbUri) {
    throw new Error(
        "La variable d'environnement MONGODB_URI doit être définie."
    );
}

export default config;
