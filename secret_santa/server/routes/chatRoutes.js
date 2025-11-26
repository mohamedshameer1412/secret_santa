const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

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
      .populate('participants', 'name email username')
      .populate('organizer', 'name email username');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isParticipant = room.participants.some(p => p._id.toString() === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this room' });
    }

    res.json({
      success: true,
      room: {
        _id: room._id,
        name: room.name,
        anonymousMode: room.anonymousMode,
        organizer: room.organizer,
        participants: room.participants,
        createdAt: room.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching room' });
  }
});

// Get all messages from a chat room (decrypts before sending)
router.get('/:roomId/messages', protect, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Find messages and populate sender
    const messages = await Message.find({ chatRoom: req.params.roomId })
      .sort({ sentAt: 1 })
      .lean();

    const User = require('../models/User'); // Make sure User model is imported

    const decryptedMessages = await Promise.all(messages.map(async msg => {
      let displaySender = msg.sender;
      let senderId = null;

      // Check if sender is an ObjectId (user reference)
      if (mongoose.Types.ObjectId.isValid(msg.sender)) {
        senderId = msg.sender;
        // Fetch the actual username from the database
        const user = await User.findById(msg.sender);
        displaySender = user ? user.username : msg.sender; // Fallback to ID if user not found
      } else if (room.anonymousMode) {
        // Already an anonymous name (string)
        displaySender = msg.sender;
      }

      // Decrypt the message text
      let decryptedText;
      try {
        decryptedText = Message.decryptText(msg.encryptedText, msg.iv);
      } catch (err) {
        console.error('Decryption error:', err);
        decryptedText = '[Message could not be decrypted]';
      }

      return {
        _id: msg._id,
        sender: displaySender, // Now contains username instead of ID
        senderId: senderId,     // Contains the user's ObjectId for comparison
        text: decryptedText,
        sentAt: msg.sentAt
      };
    }));

    res.json({ 
      success: true, 
      messages: decryptedMessages, 
      anonymousMode: room.anonymousMode 
    });
  } catch (err) {
    console.error('Error in GET /:roomId/messages:', err);
    res.status(500).json({ 
      error: 'Error retrieving messages', 
      details: err.message 
    });
  }
});

// Send a message to a chat room (encrypts before saving)
router.post('/:roomId/message', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use authenticated user ID (from JWT token)
    const userId = req.user.id;

    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Check if user is a participant
    const isParticipant = room.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this room' });
    }

    // Determine sender name (anonymous or real)
    let senderName = userId;
    if (room.anonymousMode) {
      senderName = generateAnonymousName(room, userId);
      await room.save();
    }

    const { encryptedText, iv } = Message.encryptText(text);

    const message = await Message.create({
      chatRoom: req.params.roomId,
      sender: senderName,
      encryptedText,
      iv,
      sentAt: new Date()
    });

    await ChatRoom.findByIdAndUpdate(
      req.params.roomId,
      { $push: { messages: message._id } },
      { new: true }
    );

    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error sending message', details: err.message });
  }
});

// Toggle anonymous mode for a chat room
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

router.put('/:roomId/anonymous-name', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { anonymousName, userId } = req.body;
    
    if (!anonymousName || !userId) {
      return res.status(400).json({ error: 'Anonymous name and user ID are required' });
    }
    
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
router.get('/:roomId/anonymous-names', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.query;
    
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    const usedNames = room.anonymousNames ? Array.from(room.anonymousNames.values()) : [];
    const currentUserName = room.anonymousNames && userId ? room.anonymousNames.get(userId.toString()) : null;
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

module.exports = router;
