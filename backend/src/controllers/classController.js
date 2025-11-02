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
    })
    .populate('teacher', 'name email')
    .populate('students', 'name email')
    .populate('meeting')
    .lean()
    .exec();

    if (!classes) {
      return res.status(404).json({ 
        success: false, 
        message: 'No classes found' 
      });
    }

    res.json({ 
      success: true, 
      data: classes.map(cls => ({
        ...cls,
        isTeacher: cls.teacher._id.toString() === req.user._id.toString()
      }))
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch classes'
    });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .populate('meeting');
      
    if (!classData) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    
    // Check if the user is authorized to view this class
    const userId = req.user._id.toString();
    const isTeacher = classData.teacher._id.toString() === userId;
    const isStudent = classData.students.some(student => student._id.toString() === userId);
    
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to view this class' 
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...classData.toObject(),
        isTeacher
      }
    });
  } catch (error) {
    console.error('Get class by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch class details' 
    });
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

    // Find class and populate teacher info
    const foundClass = await Class.findOne({ joinCode })
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    if (!foundClass) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid class code. Please check and try again.' 
      });
    }

    // Check if user is already a student in this class
    if (foundClass.students.some(student => student._id.toString() === userId.toString())) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already enrolled in this class' 
      });
    }

    // Check if user is the teacher of this class
    if (foundClass.teacher._id.toString() === userId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot join your own class as a student' 
      });
    }

    // Add student to class
    foundClass.students.push(userId);
    await foundClass.save();

    // Re-populate after saving
    const updatedClass = await Class.findById(foundClass._id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    res.json({ 
      success: true, 
      message: 'Successfully joined the class',
      class: updatedClass
    });
  } catch (err) {
    console.error('Join class error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to join class. Please try again.' 
    });
  }
};