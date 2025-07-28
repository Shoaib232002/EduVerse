const Message = require('../models/Message');

module.exports = (io) => {
  // Utility to emit notification to a user or class
  io.sendNotification = (target, data, isClass = false) => {
    if (isClass) io.to(target).emit('notification', data);
    else io.to(target).emit('notification', data);
    // Optionally: persist notification to DB
  };

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinClass', ({ classId, userId }) => {
      socket.join(classId);
      socket.join(userId); // Join personal room for direct notifications
      console.log(`User ${userId} joined class ${classId}`);
    });

    socket.on('chatMessage', async ({ classId, userId, content }) => {
      // Save message to DB
      const message = await Message.create({
        class: classId,
        sender: userId,
        content,
        type: 'text',
      });
      // Emit to all in class
      io.to(classId).emit('chatMessage', {
        _id: message._id,
        class: classId,
        sender: userId,
        content,
        createdAt: message.createdAt,
      });
    });

    // Whiteboard sync events
    socket.on('whiteboard-draw', ({ classId, data }) => {
      socket.to(classId).emit('whiteboard-draw', data);
    });
    socket.on('whiteboard-clear', ({ classId }) => {
      io.to(classId).emit('whiteboard-clear');
    });

    // WebRTC signaling events
    socket.on('webrtc-offer', ({ classId, offer, from }) => {
      socket.to(classId).emit('webrtc-offer', { offer, from });
    });
    socket.on('webrtc-answer', ({ classId, answer, from }) => {
      socket.to(classId).emit('webrtc-answer', { answer, from });
    });
    socket.on('webrtc-ice-candidate', ({ classId, candidate, from }) => {
      socket.to(classId).emit('webrtc-ice-candidate', { candidate, from });
    });
    // Optionally: track participants, handle leave, etc.

    // TODO: Notifications events

    // Notification event (for testing/demo)
    socket.on('sendNotification', ({ target, data, isClass }) => {
      io.sendNotification(target, data, isClass);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}; 