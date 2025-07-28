const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { authenticateJWT } = require('../middlewares/auth');

router.use(authenticateJWT); // Protect all meeting routes

router.post('/', meetingController.createMeeting);
router.get('/', meetingController.getMeetings);
router.get('/:id', meetingController.getMeetingById);
router.put('/:id', meetingController.updateMeeting);
router.delete('/:id', meetingController.deleteMeeting);

module.exports = router;