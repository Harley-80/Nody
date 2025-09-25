import express from 'express';

const router = express.Router();

// @route   GET /api/categories
// @desc    Route de test pour les catégories
// @access  Public
router.get('/', (req, res) => {
    res.json({ message: 'La route des catégories fonctionne !' });
});

export default router;
