const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/chat-files');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, videos, documents'));
    }
  }
});

// Add the anonymous name pool
const anonymousNamePool = [
  'Batman', 'Kingster', 'Shadow', 'Phoenix', 'Mystic', 'Ranger',
  'Thunder', 'Storm', 'Ninja', 'Ghost', 'Falcon', 'Wolf', 'Viper',
  'Eagle', 'Tiger', 'Dragon', 'Phantom', 'Raven', 'Hawk', 'Cobra'
];

function generateAnonymousName(room, userId) {
  // Initialize anonymousNames Map if it doesn't exist
  if (!room.anonymousNames) {
    room.anonymousNames = new Map();
  }

  // Check if user already has an anonymous name in this room
  if (room.anonymousNames.has(userId.toString())) {
    return room.anonymousNames.get(userId.toString());
  }
  
  // If no custom name set, assign a default anonymous name as fallback
  const usedNames = Array.from(room.anonymousNames.values());
  const availableNames = anonymousNamePool.filter(name => !usedNames.includes(name));
  
  let newName;
  if (availableNames.length === 0) {
    // Fallback to numbered anonymous names
    newName = `Anonymous${room.anonymousNames.size + 1}`;
  } else {
    newName = availableNames[Math.floor(Math.random() * availableNames.length)];
  }
  
  room.anonymousNames.set(userId.toString(), newName);
  return newName;
}

// Create room (protected)
router.post('/create-room', protect, async (req, res) => {
  try {
    const { name } = req.body;
    const room = await ChatRoom.createRoom(name || 'Test Room', req.user.id);
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all rooms for current user
router.get('/my-rooms', protect, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user.id
    })
    .populate('organizer', 'name email username')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      rooms: rooms.map(room => ({
        _id: room._id,
        name: room.name,
        anonymousMode: room.anonymousMode,
        organizer: room.organizer,
        participantCount: room.participants.length,
        messageCount: room.messages.length,
        createdAt: room.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching rooms' });
  }
});

// Get specific room by ID
router.get('/:roomId', protect, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId)
      .populate('organizer', 'name email username')
      .populate('participants', 'name email username profilePic');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
      p => p._id.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this room' });
    }

    res.json({ success: true, room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching room' });
  }
});

// Get all messages from a chat room (decrypts before sending)
router.get('/:roomId/messages', protect, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isParticipant = room.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this room' });
    }

    const messages = await Message.find({ roomId: req.params.roomId })
      .populate('sender', 'name username profilePic')
      .sort({ createdAt: 1 })
      .lean();

    // Decrypt all messages (with HMAC verification)
    const decryptedMessages = messages.map(msg => {
      try {
        const decrypted = {
          ...msg,
          text: Message.decryptText(msg.encryptedText, msg.iv, msg.tag)
        };

        // Get anonymous name for sender
        if (room.anonymousNames) {
          decrypted.anonymousName = room.anonymousNames.get(msg.sender._id.toString()) || 'Anonymous';
        }

        // Decrypt attachment if exists
        if (msg.attachment) {
          decrypted.attachment = {
            ...msg.attachment,
            url: `/api/chat/file/${msg._id}`,
            originalName: Message.decryptText(msg.attachment.fileName, msg.attachment.iv, msg.attachment.tag)
          };
        }

        // Map reactions with anonymous names
        if (msg.reactions && msg.reactions.length > 0) {
          decrypted.reactions = msg.reactions.map(r => ({
            emoji: r.emoji,
            anonymousName: r.anonymousName,
            isCurrentUser: r.userId.toString() === req.user.id
          }));
        }

        return decrypted;
      } catch (error) {
        console.error('Failed to decrypt message:', msg._id, error);
        return {
          ...msg,
          text: '[Message could not be decrypted]',
          anonymousName: 'Anonymous'
        };
      }
    });

    res.json({ success: true, messages: decryptedMessages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Send a message to a chat room (encrypts before saving)
router.post('/:roomId/message', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const room = await ChatRoom.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this room' });
    }

    // Encrypt message with HMAC
    const { encryptedText, iv, tag } = Message.encryptText(text.trim());

    const message = await Message.create({
      roomId: req.params.roomId,
      sender: req.user.id,
      encryptedText,
      iv,
      tag  // Store HMAC tag
    });

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username profilePic')
      .lean();

    // Decrypt for response (with HMAC verification)
    populatedMessage.text = Message.decryptText(
      populatedMessage.encryptedText,
      populatedMessage.iv,
      populatedMessage.tag
    );

    res.json({ success: true, message: populatedMessage });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Error sending message', details: err.message });
  }
});

// Get or create a private chat room between two users
router.post('/private-room', protect, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    // Check if a private room already exists between these two users
    // Sort user IDs to ensure consistent room lookup
    const userIds = [req.user.id, otherUserId].sort();
    
    let room = await ChatRoom.findOne({
      isPrivate: true,
      participants: { $all: userIds, $size: 2 }
    });

    // If no room exists, create one
    if (!room) {
      const otherUser = await require('../models/User').findById(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      room = await ChatRoom.create({
        name: `Private Chat`, // Will be displayed differently on frontend
        participants: userIds,
        organizer: req.user.id,
        anonymousMode: false,
        isPrivate: true
      });
    }

    res.json({ success: true, roomId: room._id });
  } catch (err) {
    console.error('Error creating/finding private room:', err);
    res.status(500).json({ error: 'Error creating private chat' });
  }
});

// Toggle anonymous mode for a chat room (only organizer)
router.put('/:roomId/anonymous', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { anonymousMode } = req.body;
    
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    // Only organizer can toggle
    if (!room.organizer.equals(req.user.id)) {
      return res.status(403).json({ error: 'Only organizer can toggle anonymous mode' });
    }
    
    room.anonymousMode = anonymousMode;
    await room.save();
    
    res.json({ success: true, anonymousMode: room.anonymousMode });
  } catch (err) {
    res.status(500).json({ error: 'Error toggling anonymous mode' });
  }
});

// Set custom anonymous name for a user in a room
router.put('/:roomId/anonymous-name', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { anonymousName } = req.body;
    
    if (!anonymousName) {
      return res.status(400).json({ error: 'Anonymous name is required' });
    }
    
    // Use authenticated user's ID instead of from request body
    const userId = req.user.id;
    
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    // Initialize anonymousNames Map if it doesn't exist
    if (!room.anonymousNames) {
      room.anonymousNames = new Map();
    }
    
    // Check if the name is already taken by another user
    const existingUser = Array.from(room.anonymousNames.entries())
      .find(([key, value]) => value === anonymousName && key !== userId.toString());
    
    if (existingUser) {
      return res.status(400).json({ error: 'This anonymous name is already taken' });
    }
    
    // Set the custom anonymous name
    room.anonymousNames.set(userId.toString(), anonymousName);
    await room.save();
    
    res.json({ 
      success: true, 
      message: `Anonymous name set to "${anonymousName}"`,
      anonymousName 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error setting anonymous name', details: err.message });
  }
});

// Get list of available anonymous names and current user's name
router.get('/:roomId/anonymous-names', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id; // Get from authenticated user
    
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    const usedNames = room.anonymousNames ? Array.from(room.anonymousNames.values()) : [];
    const currentUserName = room.anonymousNames ? room.anonymousNames.get(userId.toString()) : null;
    const availablePresets = anonymousNamePool.filter(name => !usedNames.includes(name));
    
    res.json({
      success: true,
      currentAnonymousName: currentUserName,
      usedNames,
      availablePresets,
      anonymousMode: room.anonymousMode
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error getting anonymous names' });
  }
});

// Edit a message
router.put('/:roomId/message/:messageId', protect, async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    // Check if message is deleted
    if (message.isDeleted) {
      return res.status(400).json({ error: 'Cannot edit deleted message' });
    }

    // Save current version to edit history
    message.editHistory.push({
      encryptedText: message.encryptedText,
      iv: message.iv,
      tag: message.tag,
      editedAt: new Date()
    });

    // Encrypt new message
    const { encryptedText, iv, tag } = Message.encryptText(text.trim());
    message.encryptedText = encryptedText;
    message.iv = iv;
    message.tag = tag;
    message.isEdited = true;

    await message.save();

    // Populate and decrypt for response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username profilePic')
      .lean();
    populatedMessage.text = Message.decryptText(
      populatedMessage.encryptedText,
      populatedMessage.iv,
      populatedMessage.tag
    );

    res.json({ success: true, message: populatedMessage });
  } catch (err) {
    console.error('Error editing message:', err);
    res.status(500).json({ error: 'Error editing message', details: err.message });
  }
});

// Delete a message (soft delete)
router.delete('/:roomId/message/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.encryptedText = Message.encryptText('[Message deleted]').encryptedText;
    message.iv = Message.encryptText('[Message deleted]').iv;
    message.tag = Message.encryptText('[Message deleted]').tag;

    await message.save();

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Error deleting message' });
  }
});

// Upload file/image with message
router.post('/:roomId/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isParticipant = room.participants.some(
      p => p.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this room' });
    }

    // Encrypt file path
    const { encryptedText: encryptedUrl, iv: fileIv, tag: fileTag } = 
      Message.encryptText(req.file.path);

    // Encrypt filename
    const { encryptedText: encryptedName } = Message.encryptText(req.file.originalname);

    // Encrypt message text
    const messageText = text || `[File: ${req.file.originalname}]`;
    const { encryptedText, iv, tag } = Message.encryptText(messageText);

    const message = await Message.create({
      roomId,
      sender: req.user.id,
      encryptedText,
      iv,
      tag,
      attachment: {
        encryptedUrl,
        iv: fileIv,
        tag: fileTag,
        fileType: req.file.mimetype.split('/')[0], // image, video, application
        fileName: encryptedName,
        fileSize: req.file.size
      },
      status: 'sent'
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username profilePic')
      .lean();
    
    populatedMessage.text = Message.decryptText(
      populatedMessage.encryptedText,
      populatedMessage.iv,
      populatedMessage.tag
    );

    if (populatedMessage.attachment) {
      populatedMessage.attachment.url = Message.decryptText(
        populatedMessage.attachment.encryptedUrl,
        populatedMessage.attachment.iv,
        populatedMessage.attachment.tag
      );
      populatedMessage.attachment.originalName = Message.decryptText(
        populatedMessage.attachment.fileName,
        fileIv,
        fileTag
      );
    }

    res.json({ success: true, message: populatedMessage });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Error uploading file', details: err.message });
  }
});

// Serve uploaded files (with authentication)
router.get('/file/:messageId', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message || !message.attachment) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user is participant in room
    const room = await ChatRoom.findById(message.roomId);
    const isParticipant = room.participants.some(
      p => p.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Decrypt file path
    const filePath = Message.decryptText(
      message.attachment.encryptedUrl,
      message.attachment.iv,
      message.attachment.tag
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('Error serving file:', err);
    res.status(500).json({ error: 'Error serving file' });
  }
});

// Add reaction to message
router.post('/:roomId/message/:messageId/reaction', protect, async (req, res) => {
  try {
    const { messageId, roomId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Get room for anonymous name
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Get or generate anonymous name
    let anonymousName = room.anonymousNames.get(req.user.id.toString());
    if (!anonymousName) {
      const usedNames = Array.from(room.anonymousNames.values());
      const availableNames = anonymousNamePool.filter(name => !usedNames.includes(name));
      anonymousName = availableNames.length > 0 
        ? availableNames[Math.floor(Math.random() * availableNames.length)]
        : `Anonymous${room.anonymousNames.size + 1}`;
      room.anonymousNames.set(req.user.id.toString(), anonymousName);
      await room.save();
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.userId.toString() === req.user.id && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction (toggle)
      message.reactions = message.reactions.filter(
        r => !(r.userId.toString() === req.user.id && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        emoji,
        userId: req.user.id,
        anonymousName,
        createdAt: new Date()
      });
    }

    await message.save();

    res.json({ 
      success: true, 
      reactions: message.reactions.map(r => ({
        emoji: r.emoji,
        anonymousName: r.anonymousName,
        isCurrentUser: r.userId.toString() === req.user.id
      }))
    });
  } catch (err) {
    console.error('Error adding reaction:', err);
    res.status(500).json({ error: 'Error adding reaction' });
  }
});

module.exports = router;
