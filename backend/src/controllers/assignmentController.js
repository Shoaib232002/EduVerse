const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const cloudinary = require('../config/cloudinary');

exports.createAssignment = async (req, res) => {
  try {
    const { classId, title, description, dueDate, topic, scheduledAt, isDraft, rubric } = req.body;
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
    // Parse rubric if it's a string
    let parsedRubric = rubric;
    if (typeof rubric === 'string') {
      try {
        parsedRubric = JSON.parse(rubric);
      } catch (e) {
        parsedRubric = [];
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
      isDraft: isDraft || false,
      rubric: parsedRubric || []
    });
    await Class.findByIdAndUpdate(classId, { $push: { assignments: assignment._id } });
    // Emit notification to class if not draft or scheduled
    const io = req.app.get('io');
    if (io && !assignment.isDraft && (!assignment.scheduledAt || new Date(assignment.scheduledAt) <= new Date())) {
      io.sendNotification(classId, { type: 'assignment', message: `New assignment: ${title}`, assignmentId: assignment._id }, true);
    }
    res.status(201).json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create assignment', error: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    const assignments = await Assignment.find({ class: classId }).sort({ dueDate: 1 });
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assignments', error: err.message });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
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
    const assignment = await Assignment.findById(id);
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
    res.status(201).json({ message: 'Submission successful' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit assignment', error: err.message });
  }
};

exports.gradeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, grade, feedback } = req.body;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const submission = assignment.submissions.find(sub => sub.student.toString() === studentId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    submission.grade = grade;
    submission.feedback = feedback;
    await assignment.save();
    // Emit notification to student
    const io = req.app.get('io');
    if (io) {
      io.sendNotification(studentId, { type: 'grade', message: `You received a grade: ${grade}`, assignmentId: assignment._id });
    }
    res.json({ message: 'Graded successfully' });
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