const StudyRoom = require('../models/StudyRoom');
const jwt = require('jsonwebtoken');

/**
 * Initialize Socket.IO for study rooms
 */
function initializeStudyRoomSocket(io) {
  const studyRoomNamespace = io.of('/study-rooms');
  
  // Middleware to authenticate socket connections
  studyRoomNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });
  
  studyRoomNamespace.on('connection', (socket) => {
    console.log(`User ${socket.username} connected to study rooms`);
    
    // Join a specific study room
    socket.on('join-room', async ({ roomSlug }) => {
      try {
        const studyRoom = await StudyRoom.findOne({ slug: roomSlug });
        
        if (!studyRoom) {
          socket.emit('error', { message: 'Study room not found' });
          return;
        }
        
        // Check if user is a participant
        const isParticipant = studyRoom.currentParticipants.some(
          p => p.userId.toString() === socket.userId
        );
        
        if (!isParticipant) {
          socket.emit('error', { message: 'Not a participant of this room' });
          return;
        }
        
        // Join the socket room
        socket.join(roomSlug);
        socket.currentRoom = roomSlug;
        
        // Notify others
        socket.to(roomSlug).emit('user-joined', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });
        
        // Send current state to the joining user
        socket.emit('room-state', {
          sharedCode: studyRoom.sharedCode,
          language: studyRoom.language,
          participants: studyRoom.currentParticipants.length,
          chat: studyRoom.chat.slice(-50) // Last 50 messages
        });
        
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });
    
    // Handle code updates (collaborative editing)
    socket.on('code-update', async ({ roomSlug, code, cursorPosition }) => {
      try {
        const studyRoom = await StudyRoom.findOne({ slug: roomSlug });
        
        if (!studyRoom) {
          socket.emit('error', { message: 'Study room not found' });
          return;
        }
        
        // Update shared code
        studyRoom.sharedCode = code;
        
        // Add to code history (keep last 10 versions)
        studyRoom.codeHistory.push({
          userId: socket.userId,
          username: socket.username,
          code,
          timestamp: new Date()
        });
        
        if (studyRoom.codeHistory.length > 10) {
          studyRoom.codeHistory = studyRoom.codeHistory.slice(-10);
        }
        
        await studyRoom.save();
        
        // Broadcast to others in the room (except sender)
        socket.to(roomSlug).emit('code-updated', {
          code,
          userId: socket.userId,
          username: socket.username,
          cursorPosition,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error updating code:', error);
        socket.emit('error', { message: 'Failed to update code' });
      }
    });
    
    // Handle cursor position updates
    socket.on('cursor-move', ({ roomSlug, position }) => {
      socket.to(roomSlug).emit('cursor-moved', {
        userId: socket.userId,
        username: socket.username,
        position
      });
    });
    
    // Handle language change
    socket.on('language-change', async ({ roomSlug, language }) => {
      try {
        const studyRoom = await StudyRoom.findOne({ slug: roomSlug });
        
        if (!studyRoom) {
          socket.emit('error', { message: 'Study room not found' });
          return;
        }
        
        studyRoom.language = language;
        await studyRoom.save();
        
        // Broadcast to all in the room
        studyRoomNamespace.to(roomSlug).emit('language-changed', {
          language,
          userId: socket.userId,
          username: socket.username
        });
        
      } catch (error) {
        console.error('Error changing language:', error);
        socket.emit('error', { message: 'Failed to change language' });
      }
    });
    
    // Handle chat messages
    socket.on('send-message', async ({ roomSlug, message }) => {
      try {
        const studyRoom = await StudyRoom.findOne({ slug: roomSlug });
        
        if (!studyRoom) {
          socket.emit('error', { message: 'Study room not found' });
          return;
        }
        
        const chatMessage = {
          userId: socket.userId,
          username: socket.username,
          message,
          timestamp: new Date()
        };
        
        // Add to chat history
        studyRoom.chat.push(chatMessage);
        
        // Keep only last 100 messages
        if (studyRoom.chat.length > 100) {
          studyRoom.chat = studyRoom.chat.slice(-100);
        }
        
        await studyRoom.save();
        
        // Broadcast to all in the room
        studyRoomNamespace.to(roomSlug).emit('new-message', chatMessage);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle code execution request
    socket.on('execute-code', ({ roomSlug, input }) => {
      // Broadcast execution request to all participants
      socket.to(roomSlug).emit('code-executing', {
        userId: socket.userId,
        username: socket.username
      });
    });
    
    // Handle execution results
    socket.on('execution-result', ({ roomSlug, result }) => {
      // Broadcast results to all participants
      studyRoomNamespace.to(roomSlug).emit('execution-completed', {
        userId: socket.userId,
        username: socket.username,
        result,
        timestamp: new Date()
      });
    });
    
    // Handle leaving room
    socket.on('leave-room', ({ roomSlug }) => {
      socket.leave(roomSlug);
      socket.to(roomSlug).emit('user-left', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date()
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.username} disconnected from study rooms`);
      
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('user-left', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });
      }
    });
  });
  
  return studyRoomNamespace;
}

module.exports = { initializeStudyRoomSocket };
