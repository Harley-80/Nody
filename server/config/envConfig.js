import dotenv from 'dotenv';

dotenv.config();

const config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

    // Base de données
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nody_db',

    // JWT
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,

    // Email
    emailService: process.env.EMAIL_SERVICE,
    emailPort: process.env.EMAIL_PORT,
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,

    // Paiements
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,

    // Redis
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT) || 6379,
    redisPassword: process.env.REDIS_PASSWORD,

    // Téléchargement de fichiers
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    uploadPath: process.env.UPLOAD_PATH || './uploads',

    // Limitation du débit
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// Validation des variables critiques
if (!config.jwtSecret) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}

if (!config.mongodbUri) {
    throw new Error('MONGODB_URI must be defined in environment variables');
}

export default config;
