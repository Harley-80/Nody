import express from 'express';

const router = express.Router();

// @route   GET /api/auth
// @desc    Route de test pour l'authentification
// @access  Public
router.get('/', (req, res) => {
    res.json({ message: "La route d'authentification fonctionne !" });
});

// Vous pourrez ajouter ici vos routes pour l'inscription (register) et la connexion (login)
// router.post('/register', ...);
// router.post('/login', ...);

export default router;
