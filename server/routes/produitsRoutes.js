import express from 'express';

const router = express.Router();

// @route   GET /api/products
// @desc    Route de test pour les produits
// @access  Public
router.get('/', (req, res) => {
    res.json({ message: 'La route des produits fonctionne !' });
});

export default router;
