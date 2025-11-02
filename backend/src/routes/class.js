const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateJWT } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roles');

router.use(authenticateJWT);

router.post('/', classController.createClass);
router.get('/', classController.getClasses);
router.get('/:id', authenticateJWT, classController.getClassById);
router.put('/:id', classController.updateClass);
router.delete('/:id', classController.deleteClass);
router.post('/join/:joinCode', authenticateJWT, authorizeRoles('student'), classController.joinClassByCode);

module.exports = router;