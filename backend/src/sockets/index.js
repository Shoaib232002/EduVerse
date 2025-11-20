const Message = require('../models/Message');

// Store active sockets and their user info
const activeUsers = new Map();

module.exports = (io) => {
  // Debug mode
  const DEBUG = true;

  // Utility to emit notification to a user or class
  io.sendNotification = async (target, data, isClass = false) => {
    const notificationData = {
      ...data,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    if (isClass) {
      console.log(`[Socket] Sending class notification to ${target}:`, notificationData);
      io.to(target).emit('notification', notificationData);
    } else {
      console.log(`[Socket] Sending user notification to ${target}:`, notificationData);
      io.to(target).emit('notification', notificationData);
    }
  };

  io.on('connection', (socket) => {
    // console.log('User connected:', socket.id);

    // Handle joining class and personal rooms
    socket.on('joinClass', async ({ userId, role }, callback) => {
      try {
        if (!userId) {
          if (DEBUG) console.log('[Socket] No userId provided');
          return callback?.({ success: false, error: 'No userId provided' });
        }

        // Store user info with socket
        activeUsers.set(socket.id, { userId, role });
        
        // Join user's personal room
        await socket.join(userId);
        if (DEBUG) console.log(`[Socket] User ${userId} (${role}) joined personal room`);
        
        // Send a test notification to verify connection
        io.to(userId).emit('notification', {
          type: 'system',
          message: 'Connected to notification system',
          id: Date.now(),
          timestamp: new Date().toISOString(),
          data: {}
        });

        callback?.({ success: true });
      } catch (error) {
        console.error('[Socket] Error in joinClass:', error);
        callback?.({ success: false, error: error.message });
      }
    });

    // Handle leaving class and personal rooms
    socket.on('leaveClass', ({ classId, userId }) => {
      if (userId) {
        socket.leave(userId);
        console.log(`User ${userId} left personal room`);
      }
      if (classId) {
        socket.leave(classId);
        console.log(`User ${userId} left class ${classId}`);
      }
    });

    // Handle joining class room for messages
    socket.on('joinClassRoom', ({ classId }) => {
      if (classId) {
        socket.join(classId);
        if (DEBUG) console.log(`[Socket] User joined class room ${classId}`);
      }
    });

    socket.on('chatMessage', async ({ classId, userId, content, senderName }) => {
      try {
        // Save message to DB
        const message = await Message.create({
          class: classId,
          sender: userId,
          content,
          type: 'text',
        });
        
        // Emit to all in class with enhanced data
        io.to(classId).emit('chatMessage', {
          _id: message._id,
          class: classId,
          sender: userId,
          senderName: senderName || 'Unknown User',
          content,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error('Error saving chat message:', error);
        // Send error back to sender only
        socket.emit('chatError', { 
          message: 'Failed to send message',
          error: error.message
        });
      }
    });

    // Whiteboard functionality removed

    // WebRTC signaling events
    socket.on('webrtc-offer', ({ to, offer, from, role }) => {
      console.log(`Received offer from ${role} with ID ${from} to ${to}`);
      socket.to(to).emit('webrtc-offer', { offer, from, role });
    });
    
    socket.on('webrtc-answer', ({ to, answer, from, role }) => {
      console.log(`Received answer from ${role} with ID ${from} to ${to}`);
      socket.to(to).emit('webrtc-answer', { answer, from, role });
    });
    
    socket.on('webrtc-ice-candidate', ({ to, candidate, from, role }) => {
      console.log(`Received ICE candidate from ${role} to ${to}`);
      socket.to(to).emit('webrtc-ice-candidate', { candidate, from, role });
    });
    
    socket.on('get-peer-role', ({ peerId }) => {
      // Find the peer's role in meeting participants
      const meetingId = Array.from(socket.rooms).find(room => 
        io.meetingParticipants && io.meetingParticipants[room]
      );
      
      if (meetingId && io.meetingParticipants[meetingId]) {
        const peer = io.meetingParticipants[meetingId].find(p => p._id === peerId);
        if (peer) {
          socket.emit('peer-role', { id: peerId, role: peer.role });
        }
      }
    });
    // --- Meeting participants tracking ---
    // In-memory participants map: { meetingId: [ { _id, name, role, muted, raisedHand } ] }
    if (!io.meetingParticipants) io.meetingParticipants = {};

    socket.on('meeting-join', ({ meetingId, user }) => {
      if (!meetingId || !user) return;
      socket.join(meetingId); // Join the meeting room for meeting events
      socket.join(meetingId); // Also join as class room for chat messages
      if (!io.meetingParticipants[meetingId]) io.meetingParticipants[meetingId] = [];
      // Add user if not already present
      if (!io.meetingParticipants[meetingId].find(u => u._id === user._id)) {
        io.meetingParticipants[meetingId].push({ 
          ...user, 
          muted: false, 
          videoEnabled: true,
          raisedHand: false, 
          whiteboardOpen: false 
        });
      }
      console.log(`[Socket] User ${user.name} joined meeting ${meetingId}. Participants:`, io.meetingParticipants[meetingId]);
      io.to(meetingId).emit('meeting-participants', io.meetingParticipants[meetingId]);

      // Broadcast teacher's whiteboard state to new participant
      const teacher = io.meetingParticipants[meetingId].find(u => u.role === 'teacher');
      if (teacher) {
        io.to(user._id).emit('whiteboard-visibility', { open: teacher.whiteboardOpen });
      }
    });

    socket.on('meeting-leave', ({ meetingId, userId }) => {
      if (!meetingId || !userId) return;
      if (io.meetingParticipants[meetingId]) {
        io.meetingParticipants[meetingId] = io.meetingParticipants[meetingId].filter(u => u._id !== userId);
        io.to(meetingId).emit('meeting-participants', io.meetingParticipants[meetingId]);
      }
    });

    socket.on('get-meeting-participants', ({ meetingId }) => {
      if (!meetingId) return;
      console.log(`[Socket] Getting participants for meeting ${meetingId}. Participants:`, io.meetingParticipants[meetingId] || []);
      socket.emit('meeting-participants', io.meetingParticipants[meetingId] || []);
    });

    socket.on('meeting-mute', ({ meetingId, userId, muted }) => {
      if (!meetingId || !userId) return;
      if (io.meetingParticipants[meetingId]) {
        const participant = io.meetingParticipants[meetingId].find(u => u._id === userId);
        if (participant) {
          participant.muted = muted;
          io.to(meetingId).emit('participant-updated', participant);
        }
      }
    });

    socket.on('meeting-video-toggle', ({ meetingId, userId, videoEnabled }) => {
      if (!meetingId || !userId) return;
      if (io.meetingParticipants[meetingId]) {
        const participant = io.meetingParticipants[meetingId].find(u => u._id === userId);
        if (participant) {
          participant.videoEnabled = videoEnabled;
          io.to(meetingId).emit('participant-updated', participant);
        }
      }
    });

    socket.on('meeting-raise-hand', ({ meetingId, userId, raisedHand }) => {
      if (!meetingId || !userId) return;
      if (io.meetingParticipants[meetingId]) {
        const participant = io.meetingParticipants[meetingId].find(u => u._id === userId);
        if (participant) {
          participant.raisedHand = raisedHand;
          io.to(meetingId).emit('participant-updated', participant);
        }
      }
    });

    // Meeting end event - clear messages and participants
    socket.on('meeting-end', async ({ meetingId, classId }) => {
      if (!meetingId || !classId) return;
      
      try {
        // Clear all messages for this class
        await Message.deleteMany({ class: classId });
        
        // Clear participants for this meeting
        if (io.meetingParticipants[meetingId]) {
          delete io.meetingParticipants[meetingId];
        }
        
        // Notify all users in the meeting that it has ended
        io.to(meetingId).emit('meeting-ended', { meetingId, classId });
        
        console.log(`[Socket] Meeting ${meetingId} ended. Messages cleared for class ${classId}.`);
      } catch (error) {
        console.error('Error ending meeting:', error);
        socket.emit('meeting-error', { message: 'Failed to end meeting', error: error.message });
      }
    });

    // Whiteboard visibility event
    socket.on('whiteboard-visibility', ({ meetingId, open }) => {
      // Update teacher's whiteboard state in participants list
      if (io.meetingParticipants[meetingId]) {
        io.meetingParticipants[meetingId] = io.meetingParticipants[meetingId].map(u =>
          u.role === 'teacher' ? { ...u, whiteboardOpen: open } : u
        );
        io.to(meetingId).emit('meeting-participants', io.meetingParticipants[meetingId]);
      }
      io.to(meetingId).emit('whiteboard-visibility', { open });
    });

    // Notification events
    socket.on('sendNotification', ({ type, data, classId }) => {
      if (type === 'newAnnouncement') {
        // Broadcast new announcement to all users in the class
        io.to(classId).emit('newAnnouncement', data);
        
        // Also send a general notification
        // Make sure the message is always a string, not an object
        const authorName = data.author && typeof data.author === 'object' && data.author.name 
          ? data.author.name 
          : 'teacher';
          
        io.to(classId).emit('notification', {
          type: 'announcement',
          message: `New announcement: ${data.title} by ${authorName}`,
          data: data
        });
      } else if (type === 'deleteAnnouncement') {
        // Broadcast announcement deletion to all users in the class
        io.to(classId).emit('deleteAnnouncement', data);
      } else {
        // Handle other notification types
        if (data.target) {
          io.to(data.target).emit('notification', data);
        } else if (classId) {
          io.to(classId).emit('notification', data);
        }
      }
    });

    socket.on('disconnect', () => {
      const userInfo = activeUsers.get(socket.id);
      if (userInfo) {
        if (DEBUG) console.log(`[Socket] User ${userInfo.userId} disconnected`);
        activeUsers.delete(socket.id);
      }
    });
  });
};