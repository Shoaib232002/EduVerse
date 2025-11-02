const Message = require('../models/Message');
const Class = require('../models/Class');

// Get messages for a class
exports.getMessages = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Verify class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    // Get messages for the class
    const messages = await Message.find({ class: classId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 })
      .lean();
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch messages'
    });
  }
};

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { classId } = req.params;
    const { content, type = 'text' } = req.body;
    
    // Verify class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    // Create message
    const message = await Message.create({
      class: classId,
      sender: req.user._id,
      content,
      type
    });
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email');
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(classId).emit('chatMessage', {
        _id: populatedMessage._id,
        class: classId,
        sender: populatedMessage.sender._id,
        senderName: populatedMessage.sender.name,
        content,
        createdAt: populatedMessage.createdAt
      });
    }
    
    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create message'
    });
  }
};