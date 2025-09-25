import express from 'express';

const router = express.Router();

// @route   GET /api/users
// @desc    Route de test pour les utilisateurs
// @access  Public
router.get('/', (req, res) => {
    res.json({ message: 'La route des utilisateurs fonctionne !' });
});

export default router;
