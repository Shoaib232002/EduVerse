const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const Class = require('../models/Class');

exports.getAnnouncements = async (req, res) => {
  try {
    const classId = req.params.classId;
    const announcements = await Announcement.find({ class: classId })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch announcements'
    });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const classId = req.params.classId;
    const { title, content } = req.body;

    // Check if class exists and user has permission
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify user is the teacher of the class
    if (classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the class teacher can create announcements'
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      class: classId,
      author: req.user._id
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'name');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(classId).emit('newAnnouncement', populatedAnnouncement);
      
      // Make sure to use a string for the message, not an object
      const authorName = populatedAnnouncement.author && 
                         typeof populatedAnnouncement.author === 'object' && 
                         populatedAnnouncement.author.name 
        ? populatedAnnouncement.author.name 
        : 'teacher';
        
      io.to(classId).emit('notification', {
        type: 'announcement',
        message: `New announcement: ${title} by ${authorName}`,
        data: populatedAnnouncement
      });
    }

    res.status(201).json({
      success: true,
      data: populatedAnnouncement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create announcement'
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { classId, announcementId } = req.params;

    // First check if the class exists and user has permission
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the class teacher can delete announcements'
      });
    }

    // Check if announcement exists
    const announcement = await Announcement.findOne({
      _id: announcementId,
      class: classId
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Delete the announcement and update class atomically
    const deleteResult = await Promise.all([
      Announcement.deleteOne({ _id: announcementId }),
      Class.updateOne(
        { _id: classId },
        { $pull: { announcements: announcementId } }
      )
    ]);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(classId).emit('deleteAnnouncement', {
        announcementId: announcementId,
        classId,
        authorId: req.user._id.toString()
      });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete announcement'
    });
  }
};
