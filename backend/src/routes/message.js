const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateJWT } = require('../middlewares/auth');

router.use(authenticateJWT);

// Primary routes for class messages
router.get('/classes/:classId/messages', messageController.getMessages);
router.post('/classes/:classId/messages', messageController.createMessage);

// Alternative routes for backward compatibility
router.get('/class/:classId/messages', messageController.getMessages);
router.post('/class/:classId/messages', messageController.createMessage);

// Another alternative format
router.get('/messages/class/:classId', messageController.getMessages);
router.post('/messages/class/:classId', messageController.createMessage);

// Direct messages endpoint
router.get('/messages/:classId', messageController.getMessages);
router.post('/messages/:classId', messageController.createMessage);

module.exports = router;