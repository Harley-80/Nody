/**
 * Middleware de gestion des erreurs pour Express.
 * Ce middleware intercepte les erreurs survenues dans l'application,
 * formate une réponse JSON standardisée et l'envoie au client.
 *
 * @param {Error} err - L'objet d'erreur passé par Express.
 * @param {import('express').Request} req - L'objet de requête Express.
 * @param {import('express').Response} res - L'objet de réponse Express.
 * @param {import('express').NextFunction} next - La fonction middleware suivante (non utilisée ici, mais requise par la signature).
 */
const errorHandler = (err, req, res, next) => {
    // Détermine le code de statut. Si le code est 200 (OK), on le change en 500 (Erreur Interne du Serveur).
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Envoie une réponse JSON avec le message d'erreur.
    // La pile d'appels (stack trace) n'est incluse qu'en environnement de développement pour le débogage.
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export default errorHandler;
