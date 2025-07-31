const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateJWT } = require('../middlewares/auth');

router.use(authenticateJWT);

router.get('/:classId/announcements', announcementController.getAnnouncements);
router.post('/:classId/announcements', announcementController.createAnnouncement);
router.delete('/:classId/announcements/:announcementId', announcementController.deleteAnnouncement);

module.exports = router;
