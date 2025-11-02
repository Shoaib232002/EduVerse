const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateJWT } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roles');

router.use(authenticateJWT, authorizeRoles('admin'));

router.get('/users', adminController.listUsers);
router.post('/users/:id/block', adminController.blockUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/role', adminController.updateUserRole);

router.get('/analytics', adminController.getAnalytics);

router.get('/classes', adminController.listClasses);
router.delete('/classes/:id', adminController.deleteClass);

router.get('/assignments', adminController.listAssignments);
router.delete('/assignments/:id', adminController.deleteAssignment);

router.get('/notes', adminController.listNotes);
router.delete('/notes/:id', adminController.deleteNote);

router.get('/announcements', adminController.listAnnouncements);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

module.exports = router;