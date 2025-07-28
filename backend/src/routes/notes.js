const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { authenticateJWT } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roles');
const { upload } = require('../middlewares/upload');

router.post('/upload', authenticateJWT, authorizeRoles('teacher', 'student'), upload.single('file'), notesController.uploadNote);
router.get('/:classId', authenticateJWT, notesController.getNotes);
router.get('/download/:id', authenticateJWT, notesController.downloadNote);

module.exports = router; 