const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/:username', portfolioController.getPublicPortfolio);

// Protected routes (authenticated user managing their own portfolio)
router.get('/me/link', authenticate, portfolioController.getPortfolioLink);
router.put('/me/visibility', authenticate, portfolioController.togglePortfolioVisibility);
router.get('/me/export', authenticate, portfolioController.exportPortfolio);

module.exports = router;
