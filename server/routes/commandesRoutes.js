import express from 'express';

const router = express.Router();

// @route   GET /api/orders
// @desc    Route de test pour les commandes
// @access  Public
router.get('/', (req, res) => {
    res.json({ message: 'La route des commandes fonctionne !' });
});

export default router;
