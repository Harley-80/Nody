import express from 'express';

const router = express.Router();

// @route   GET /api/payments
// @desc    Route de test pour les paiements
// @access  Public
router.get('/', (req, res) => {
    res.json({ message: 'La route des paiements fonctionne !' });
});

export default router;
