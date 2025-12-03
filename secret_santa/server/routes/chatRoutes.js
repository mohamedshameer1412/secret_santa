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
        return {
          ...msg,
          text: Message.decryptText(msg.encryptedText, msg.iv, msg.tag)
        };
      } catch (error) {
        console.error('Failed to decrypt message:', msg._id, error);
        return {
          ...msg,
          text: '[Message could not be decrypted]'
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
