const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const classRouter = require('./class');
const assignmentRouter = require('./assignment');
const notesRouter = require('./notes');
const meetingRouter = require('./meeting');
const adminRouter = require('./admin');
const announcementRouter = require('./announcement');
const messageRouter = require('./message');

// Mount routes
router.use('/auth', authRouter);
router.use('/classes', classRouter);
router.use('/classes', announcementRouter);
router.use('/', messageRouter); // Mount message routes at root to handle all formats
router.use('/assignments', assignmentRouter);
router.use('/notes', notesRouter);
router.use('/meetings', meetingRouter);
router.use('/admin', adminRouter);

module.exports = router;