const Class = require('../models/Class');
const Meeting = require('../models/Meeting'); // Import your Meeting model

exports.createClass = async (req, res) => {
  try {
    const {
      name,
      description,
      section,
      subject,
      room,
      scheduled,
      startTime,
      endTime,
      recurring,
      recurrencePattern,
      password,
      waitingRoom,
      videoOn,
      audioOn,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    // Generate a unique join code
    const joinCode = Math.random().toString(36).substring(2, 8);

    // 1. Create the meeting (classroom)
    const meeting = await Meeting.create({
      title: name, // Use title instead of topic
      description,
      date: startTime || new Date(), // Use startTime or current date
      host: req.user._id,
      participants: []
    });

    // 2. Create the class and link the meeting
    const newClass = await Class.create({
      name,
      description,
      section,
      subject,
      room,
      teacher: req.user._id,
      students: [],
      joinCode,
      scheduled,
      startTime,
      endTime,
      recurring,
      recurrencePattern,
      password,
      waitingRoom,
      videoOn,
      audioOn,
      meeting: meeting._id // Link the meeting to the class
    });

    res.status(201).json({ success: true, class: newClass });
  } catch (err) {
    console.error('Create class error:', err);
    res.status(500).json({ success: false, message: 'Failed to create class', error: err.message });
  }
};

exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find({
      $or: [
        { teacher: req.user._id },
        { students: req.user._id }
      ]
    });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.json({ success: true, data: updatedClass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.joinClass = async (req, res) => {
  try {
    const classToJoin = await Class.findOne({ joinCode: req.params.code });
    if (!classToJoin) {
      return res.status(404).json({ success: false, message: 'Invalid join code' });
    }
    if (!classToJoin.students.includes(req.user._id)) {
      classToJoin.students.push(req.user._id);
      await classToJoin.save();
    }
    res.json({ success: true, data: classToJoin });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.joinClassByCode = async (req, res) => {
  try {
    const { joinCode } = req.params;
    const userId = req.user._id;
    const foundClass = await Class.findOne({ joinCode });
    if (!foundClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (!foundClass.students.includes(userId)) {
      foundClass.students.push(userId);
      await foundClass.save();
    }
    res.json({ success: true, class: foundClass });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to join class' });
  }
};