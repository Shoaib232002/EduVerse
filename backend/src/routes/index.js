const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const classRouter = require('./class');
const assignmentRouter = require('./assignment');
const notesRouter = require('./notes');
const meetingRouter = require('./meeting');
const adminRouter = require('./admin');
const announcementRouter = require('./announcement');

router.use('/auth', authRouter);
router.use('/classes', classRouter);
router.use('/assignment', assignmentRouter);
router.use('/notes', notesRouter);
router.use('/meeting', meetingRouter);
router.use('/admin', adminRouter);
router.use('/classes', announcementRouter); // Mount announcement routes under /classes

module.exports = router; 