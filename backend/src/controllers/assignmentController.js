const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const cloudinary = require('../config/cloudinary');

exports.createAssignment = async (req, res) => {
  try {
    const { classId, title, description, dueDate, topic, scheduledAt, isDraft } = req.body;
    let attachments = [];
    // Handle multiple file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
            if (error) reject(error);
            else {
              attachments.push(result.secure_url);
              resolve();
            }
          });
          stream.end(file.buffer);
        });
      }
    }

    const assignment = await Assignment.create({
      class: classId,
      title,
      description,
      attachments,
      topic,
      dueDate,
      scheduledAt,
      isDraft: isDraft || false
    });
    // Update class with assignment reference
    await Class.findByIdAndUpdate(classId, { $push: { assignments: assignment._id } });
    // Emit notification to class if not draft or scheduled
    if (!assignment.isDraft && (!assignment.scheduledAt || new Date(assignment.scheduledAt) <= new Date())) {
      const classObj = await Class.findById(classId).populate('students', '_id name');
      const io = req.app.get('io'); // Get io instance correctly
      
      if (classObj && io) {
        const notificationData = {
          type: 'assignment',
          message: `New assignment: ${title}`,
          data: {
            assignmentId: assignment._id,
            title,
            class: classId,
            dueDate,
            teacher: req.user.name
          }
        };

        // Send notification to each student individually
        classObj.students.forEach(student => {
          io.to(student._id.toString()).emit('notification', notificationData);
        });

        // Also emit to class room for real-time updates
        io.to(classId).emit('newAssignment', assignment);
      }
    }
    res.status(201).json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create assignment', error: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    const assignments = await Assignment.find({ class: classId })
      .sort({ dueDate: 1 })
      .populate({
        path: 'submissions.student',
        select: 'name email',
        model: 'User'
      })
      .lean();  // Convert to plain JavaScript objects
    
    // Ensure every submission has a populated student
    const processedAssignments = assignments.map(assignment => ({
      ...assignment,
      submissions: assignment.submissions.map(submission => ({
        ...submission,
        student: submission.student || null
      }))
    }));
    
    res.json({ assignments: processedAssignments });
  } catch (err) {
    console.error('Error in getAssignments:', err);
    res.status(500).json({ message: 'Failed to fetch assignments', error: err.message });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id)
      .populate('submissions.student', 'name email');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assignment', error: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { textEntry } = req.body;
    let assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    let files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
            if (error) reject(error);
            else {
              files.push(result.secure_url);
              resolve();
            }
          });
          stream.end(file.buffer);
        });
      }
    }
    const submission = {
      student: req.user._id,
      files,
      textEntry,
      submittedAt: new Date(),
      status: 'submitted'
    };
    assignment.submissions.push(submission);
    await assignment.save();

    // Fetch the updated assignment with populated student data
    assignment = await Assignment.findById(id)
      .populate({
        path: 'submissions.student',
        select: 'name email',
        model: 'User'
      });

    res.status(201).json({ 
      message: 'Submission successful', 
      assignment: assignment.toObject() 
    });
  } catch (err) {
    console.error('Error in submitAssignment:', err);
    res.status(500).json({ message: 'Failed to submit assignment', error: err.message });
  }
};

exports.gradeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionId, grade, feedback } = req.body;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const submission = assignment.submissions.id(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    await assignment.save();
    // Populate the student data
    await assignment.populate('submissions.student', 'name email');
    
    // Send grade notification to student
    try {
      const io = req.app.get('io');
      if (io && submission.student) {
        const notificationData = {
          type: 'grade',
          message: `You received a grade of ${grade} for assignment "${assignment.title}"`,
          data: {
            assignmentId: assignment._id,
            title: assignment.title,
            grade,
            class: assignment.class,
            feedback
          }
        };

        // Emit to the student's personal room so they'll get a notification even if not in the class page
        io.to(submission.student.toString()).emit('notification', notificationData);

        // Also emit to the class room for any clients currently viewing the class
        if (assignment.class) {
          io.to(assignment.class.toString()).emit('notification', notificationData);
        }
      }
    } catch (notifyErr) {
      console.error('Failed to send grade notification:', notifyErr);
    }
    
    res.json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to grade assignment', error: err.message });
  }
};

// Add endpoint for adding a comment to a submission
exports.addSubmissionComment = async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { text } = req.body;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const submission = assignment.submissions.id(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    submission.comments.push({ author: req.user._id, text });
    await assignment.save();
    res.status(201).json({ message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete assignment', error: err.message });
  }
};