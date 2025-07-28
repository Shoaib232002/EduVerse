const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middlewares/auth');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', authenticateJWT, authController.getMe);

// OAuth routes
router.get('/google', (req, res) => res.send('Google OAuth endpoint (to be implemented)'));
router.get('/google/callback', authController.googleCallback);

module.exports = router;