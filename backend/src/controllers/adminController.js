const User = require('../models/User');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Notes = require('../models/Notes');

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.blocked = !user.blocked;
    await user.save();
    res.json({ message: `User ${user.blocked ? 'blocked' : 'unblocked'}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to block/unblock user', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const classCount = await Class.countDocuments();
    const assignmentCount = await Assignment.countDocuments();
    const notesCount = await Notes.countDocuments();
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('-password');
    const recentClasses = await Class.find().sort({ createdAt: -1 }).limit(5);
    const recentAssignments = await Assignment.find().sort({ createdAt: -1 }).limit(5);
    const recentNotes = await Notes.find().sort({ createdAt: -1 }).limit(5);
    res.json({
      counts: { userCount, classCount, assignmentCount, notesCount },
      recent: { users: recentUsers, classes: recentClasses, assignments: recentAssignments, notes: recentNotes }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: err.message });
  }
};

exports.listClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('teacher', 'name').populate('students', 'name');
    res.json({ classes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch classes', error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete class', error: err.message });
  }
};

exports.listAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('class', 'name');
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assignments', error: err.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete assignment', error: err.message });
  }
};

exports.listNotes = async (req, res) => {
  try {
    const notes = await Notes.find().populate('class', 'name').populate('uploader', 'name');
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    await Notes.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete note', error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = role;
    await user.save();
    res.json({ message: 'User role updated', user: { _id: user._id, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user role', error: err.message });
  }
};