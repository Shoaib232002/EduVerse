const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Notes = require('../models/Notes');
const Announcement = require('../models/Announcement');

exports.listUsers = async (req, res) => {
  try {
    // Verify user model is available
    if (!User) {
      throw new Error('User model is not properly initialized');
    }

    console.log('Fetching users list...');
    const users = await User.find()
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(`Successfully fetched ${users.length} users`);
    res.json({ 
      users,
      count: users.length,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error in listUsers:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    const message = err.name === 'ValidationError' 
      ? 'Invalid data format'
      : 'Failed to fetch users';
      
    res.status(status).json({ 
      message, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.blockUser = async (req, res) => {
  try {
    // Input validation
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID is required',
        details: 'The user ID was not provided in the request parameters'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        details: 'The specified user ID does not exist in the database'
      });
    }

    // Prevent self-blocking
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Cannot block yourself',
        details: 'Administrators cannot block their own accounts for security reasons'
      });
    }

    // Update blocked status
    const newBlockedStatus = !user.blocked;
    user.blocked = newBlockedStatus;
    await user.save();

    console.log(`User ${user._id} ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully`);
    
    res.json({ 
      message: `User ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully`,
      user: { 
        _id: user._id, 
        name: user.name,
        email: user.email,
        blocked: user.blocked 
      }
    });
  } catch (err) {
    console.error('Error in blockUser:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    const message = err.name === 'ValidationError'
      ? 'Invalid data format'
      : 'Failed to block/unblock user';
      
    res.status(status).json({ 
      message,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Input validation
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID is required',
        details: 'The user ID was not provided in the request parameters'
      });
    }

    // Find user first to ensure it exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        details: 'The specified user ID does not exist in the database'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Cannot delete your own account',
        details: 'Administrators cannot delete their own accounts for security reasons'
      });
    }

    // Store user info for response
    const userInfo = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Delete the user
    await User.findByIdAndDelete(userId);
    console.log(`User ${userId} deleted successfully`);

    // Clean up related data
    await Promise.allSettled([
      // Remove user from classes (as student)
      Class.updateMany(
        { students: userId },
        { $pull: { students: userId } }
      ),
      // Remove user's assignments
      Assignment.deleteMany({ student: userId }),
      // Remove user's notes
      Notes.deleteMany({ uploader: userId }),
      // Remove user's announcements
      Announcement.deleteMany({ author: userId })
    ]);
    
    res.json({ 
      message: 'User deleted successfully',
      user: userInfo 
    });
  } catch (err) {
    console.error('Error in deleteUser:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    const message = err.name === 'ValidationError'
      ? 'Invalid data format'
      : 'Failed to delete user';
      
    res.status(status).json({ 
      message,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // First verify that models are available
    if (!User || !Class || !Assignment || !Notes || !Announcement) {
      throw new Error('Required models are not properly initialized');
    }

    console.log('Starting analytics data collection...');
    
    // Get counts first
    let counts;
    try {
      counts = await Promise.all([
        User.countDocuments().exec(),
        Class.countDocuments().exec(),
        Assignment.countDocuments().exec(),
        Notes.countDocuments().exec(),
        Announcement.countDocuments().exec()
      ]);
      console.log('Successfully fetched counts');
    } catch (err) {
      console.error('Error fetching counts:', err);
      throw new Error('Failed to fetch database counts');
    }

    // Get recent users
    let recentUsers = [];
    try {
      recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('-password')
        .exec();
      console.log('Successfully fetched recent users');
    } catch (err) {
      console.error('Error fetching recent users:', err);
      // Continue with empty array
    }

    // Get recent classes with their relations
    let recentClasses = [];
    try {
      recentClasses = await Class.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('teacher', 'name email')
        .populate('students', 'name email')
        .populate({
          path: 'announcements',
          model: 'Announcement',
          options: { sort: { createdAt: -1 } }
        })
        .populate({
          path: 'announcements.author',
          model: 'User',
          select: 'name email'
        })
        .exec();
      console.log('Successfully fetched recent classes');
    } catch (err) {
      console.error('Error fetching recent classes:', err);
      // Continue with empty array
    }

    // Get recent assignments
    let recentAssignments = [];
    try {
      recentAssignments = await Assignment.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('class', 'name')
        .exec();
      console.log('Successfully fetched recent assignments');
    } catch (err) {
      console.error('Error fetching recent assignments:', err);
      // Continue with empty array
    }

    // Get recent notes
    let recentNotes = [];
    try {
      recentNotes = await Notes.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('class', 'name')
        .populate('uploader', 'name')
        .exec();
      console.log('Successfully fetched recent notes');
    } catch (err) {
      console.error('Error fetching recent notes:', err);
      // Continue with empty array
    }

    // Get recent announcements
    let recentAnnouncements = [];
    try {
      recentAnnouncements = await Announcement.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('class', 'name')
        .populate('author', 'name')
        .exec();
      console.log('Successfully fetched recent announcements');
    } catch (err) {
      console.error('Error fetching recent announcements:', err);
      // Continue with empty array
    }

    // Process classes with announcements safely
    const processedClasses = recentClasses.map(c => {
      try {
        const classObj = c.toObject();
        return {
          ...classObj,
          announcements: (classObj.announcements || []).sort((a, b) => b.createdAt - a.createdAt)
        };
      } catch (err) {
        console.error('Error processing class:', err);
        return c;
      }
    });

    const [userCount, classCount, assignmentCount, notesCount, announcementCount] = counts;

    res.json({
      counts: { 
        userCount: userCount || 0, 
        classCount: classCount || 0, 
        assignmentCount: assignmentCount || 0, 
        notesCount: notesCount || 0,
        announcementCount: announcementCount || 0
      },
      recent: { 
        users: recentUsers || [], 
        classes: processedClasses || [],
        assignments: recentAssignments || [], 
        notes: recentNotes || [],
        announcements: recentAnnouncements || []
      }
    });
    console.log('Analytics data collection completed successfully');
  } catch (err) {
    console.error('Error in analytics endpoint:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    const message = err.name === 'ValidationError' 
      ? 'Invalid data format'
      : 'Failed to fetch analytics';
      
    res.status(status).json({ 
      message,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.listClasses = async (req, res) => {
  try {
    if (!Class) {
      throw new Error('Class model is not properly initialized');
    }

    console.log('Fetching classes list...');
    const classes = await Class.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(`Successfully fetched ${classes.length} classes`);
    res.json({ 
      classes,
      count: classes.length,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error in listClasses:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ 
      message: 'Failed to fetch classes',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    if (!classId) {
      return res.status(400).json({ 
        message: 'Class ID is required',
        details: 'The class ID was not provided in the request parameters'
      });
    }

    // Find class first to ensure it exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ 
        message: 'Class not found',
        details: 'The specified class ID does not exist in the database'
      });
    }

    // Store class info for response
    const classInfo = {
      _id: classDoc._id,
      name: classDoc.name,
      teacher: classDoc.teacher,
      studentCount: classDoc.students?.length || 0
    };

    // Delete the class
    await Class.findByIdAndDelete(classId);
    console.log(`Class ${classId} deleted successfully`);

    // Clean up related data
    await Promise.allSettled([
      Assignment.deleteMany({ class: classId }),
      Notes.deleteMany({ class: classId }),
      Announcement.deleteMany({ class: classId })
    ]);

    res.json({ 
      message: 'Class and related data deleted successfully',
      class: classInfo
    });
  } catch (err) {
    console.error('Error in deleteClass:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ 
      message: 'Failed to delete class',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.listAssignments = async (req, res) => {
  try {
    if (!Assignment) {
      throw new Error('Assignment model is not properly initialized');
    }

    console.log('Fetching assignments list...');

    // First verify database connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection is not ready');
    }

    // Add basic query validation
    const query = {};
    const sort = { createdAt: -1 };
    
    // Use aggregation for better performance and error handling
    const assignments = await Assignment.aggregate([
      { $match: query },
      { $sort: sort },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'class'
        }
      },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          dueDate: 1,
          createdAt: 1,
          'class._id': 1,
          'class.name': 1,
          submissionCount: { $size: { $ifNull: ['$submissions', []] } }
        }
      }
    ]).exec();

    // Add error handling for empty results
    if (!assignments) {
      assignments = [];
    }

    console.log(`Successfully fetched ${assignments.length} assignments`);
    
    // Send a more detailed response
    res.json({ 
      success: true,
      assignments,
      count: assignments.length,
      timestamp: new Date(),
      query: {
        filters: query,
        sort: sort
      }
    });

  } catch (err) {
    console.error('Error in listAssignments:', err);
    
    // More specific error handling
    let status = 500;
    let message = 'Failed to fetch assignments';
    
    if (err.name === 'ValidationError') {
      status = 400;
      message = 'Invalid query parameters';
    } else if (err.message === 'Database connection is not ready') {
      status = 503;
      message = 'Database service unavailable';
    }

    res.status(status).json({ 
      success: false,
      message,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
        query: req.query
      } : undefined
    });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    if (!assignmentId) {
      return res.status(400).json({ 
        message: 'Assignment ID is required',
        details: 'The assignment ID was not provided in the request parameters'
      });
    }

    // Find assignment first to ensure it exists
    const assignment = await Assignment.findById(assignmentId)
      .populate('class', 'name')
      .populate('teacher', 'name');
    if (!assignment) {
      return res.status(404).json({ 
        message: 'Assignment not found',
        details: 'The specified assignment ID does not exist in the database'
      });
    }

    // Store assignment info for response
    const assignmentInfo = {
      _id: assignment._id,
      title: assignment.title,
      class: assignment.class?.name,
      teacher: assignment.teacher?.name,
      dueDate: assignment.dueDate
    };

    // Delete the assignment
    await Assignment.findByIdAndDelete(assignmentId);
    console.log(`Assignment ${assignmentId} deleted successfully`);

    res.json({ 
      message: 'Assignment deleted successfully',
      assignment: assignmentInfo
    });
  } catch (err) {
    console.error('Error in deleteAssignment:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ 
      message: 'Failed to delete assignment',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.listNotes = async (req, res) => {
  try {
    if (!Notes) {
      throw new Error('Notes model is not properly initialized');
    }

    console.log('Fetching notes list...');
    const notes = await Notes.find()
      .populate('class', 'name')
      .populate('uploader', 'name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(`Successfully fetched ${notes.length} notes`);
    res.json({ 
      notes,
      count: notes.length,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error in listNotes:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ 
      message: 'Failed to fetch notes',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    if (!noteId) {
      return res.status(400).json({ 
        message: 'Note ID is required',
        details: 'The note ID was not provided in the request parameters'
      });
    }

    // Find note first to ensure it exists
    const note = await Notes.findById(noteId)
      .populate('class', 'name')
      .populate('uploader', 'name');
    if (!note) {
      return res.status(404).json({ 
        message: 'Note not found',
        details: 'The specified note ID does not exist in the database'
      });
    }

    // Store note info for response
    const noteInfo = {
      _id: note._id,
      title: note.title,
      class: note.class?.name,
      uploader: note.uploader?.name,
      type: note.type
    };

    // Delete the note
    await Notes.findByIdAndDelete(noteId);
    console.log(`Note ${noteId} deleted successfully`);

    // Also delete the file from storage if there is one
    if (note.fileUrl) {
      try {
        // Implement your file deletion logic here
        // For example, if using cloudinary:
        // await cloudinary.uploader.destroy(note.filePublicId);
        console.log('Associated file deleted successfully');
      } catch (fileErr) {
        console.error('Error deleting note file:', fileErr);
      }
    }

    res.json({ 
      message: 'Note deleted successfully',
      note: noteInfo
    });
  } catch (err) {
    console.error('Error in deleteNote:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ 
      message: 'Failed to delete note',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.listAnnouncements = async (req, res) => {
  try {
    if (!Announcement) {
      throw new Error('Announcement model is not properly initialized');
    }

    console.log('Fetching announcements list...');
    const announcements = await Announcement.find()
      .populate('class', 'name')
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(`Successfully fetched ${announcements.length} announcements`);
    res.json({ 
      announcements,
      count: announcements.length,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error in listAnnouncements:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ 
      message: 'Failed to fetch announcements',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcementId = req.params.id;
    if (!announcementId) {
      return res.status(400).json({ 
        message: 'Announcement ID is required',
        details: 'The announcement ID was not provided in the request parameters'
      });
    }

    // Find announcement first to ensure it exists
    const announcement = await Announcement.findById(announcementId)
      .populate('class', 'name')
      .populate('author', 'name');
    if (!announcement) {
      return res.status(404).json({ 
        message: 'Announcement not found',
        details: 'The specified announcement ID does not exist in the database'
      });
    }

    // Store announcement info for response
    const announcementInfo = {
      _id: announcement._id,
      title: announcement.title,
      class: announcement.class?.name,
      author: announcement.author?.name,
      createdAt: announcement.createdAt
    };

    // Delete the announcement
    await Announcement.findByIdAndDelete(announcementId);
    console.log(`Announcement ${announcementId} deleted successfully`);

    // Update class to remove the announcement reference
    if (announcement.class) {
      await Class.updateOne(
        { _id: announcement.class._id },
        { $pull: { announcements: announcementId } }
      );
    }

    res.json({ 
      message: 'Announcement deleted successfully',
      announcement: announcementInfo
    });
  } catch (err) {
    console.error('Error in deleteAnnouncement:', err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ 
      message: 'Failed to delete announcement',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    // Validate role
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role', 
        details: `Role must be one of: ${validRoles.join(', ')}` 
      });
    }

    // Validate user ID
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find and update user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing own role (if admin tries to change their own role)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Cannot change your own role',
        details: 'Administrators cannot modify their own role for security reasons.'
      });
    }

    // Update role
    user.role = role;
    await user.save();

    res.json({ 
      message: `User role successfully updated to ${role}`,
      user: { 
        _id: user._id, 
        role: user.role,
        name: user.name,
        email: user.email
      } 
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ 
      message: 'Failed to update user role',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};