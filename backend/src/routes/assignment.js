const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateJWT } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roles');
const { upload } = require('../middlewares/upload');

// Use upload.array for multiple files
router.post('/', authenticateJWT, authorizeRoles('teacher'), upload.array('files', 10), assignmentController.createAssignment);
router.get('/:classId', authenticateJWT, assignmentController.getAssignments);
router.get('/details/:id', authenticateJWT, assignmentController.getAssignment);
router.post('/:id/submit', authenticateJWT, authorizeRoles('student'), upload.array('files', 10), assignmentController.submitAssignment);
router.post('/:id/grade', authenticateJWT, authorizeRoles('teacher'), assignmentController.gradeAssignment);
// New route for adding a comment to a submission
router.post('/:id/submission/:submissionId/comment', authenticateJWT, assignmentController.addSubmissionComment);
// Delete assignment
router.delete('/:id', authenticateJWT, authorizeRoles('teacher'), assignmentController.deleteAssignment);

module.exports = router;