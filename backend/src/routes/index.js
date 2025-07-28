const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const classRouter = require('./class');
const assignmentRouter = require('./assignment');
const notesRouter = require('./notes');
const meetingRouter = require('./meeting');
const adminRouter = require('./admin');

router.use('/auth', authRouter);
router.use('/class', classRouter);
router.use('/assignment', assignmentRouter);
router.use('/notes', notesRouter);
router.use('/meeting', meetingRouter);
router.use('/admin', adminRouter);

module.exports = router; 