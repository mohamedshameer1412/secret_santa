const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const { protect } = require('../middleware/auth');

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

// Send a message to a chat room (encrypts before saving)
router.post('/:roomId/message', async (req, res) => {
  try {
    let { sender, text } = req.body;
    if (!sender || !text) {
      return res.status(400).json({ error: 'Sender and text are required' });
    }

    // Get room to check anonymous mode
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // If anonymous mode is on, use anonymous name
    if (room.anonymousMode) {
      sender = generateAnonymousName(room, sender); // Use original sender as userId
      await room.save(); // Save updated anonymous names mapping
    }

    const { encryptedText, iv } = Message.encryptText(text);

    const message = await Message.create({
      chatRoom: req.params.roomId,
      sender,
      encryptedText,
      iv
    });

    // Add message to the chatRoom
    await ChatRoom.findByIdAndUpdate(
      req.params.roomId,
      { $push: { messages: message._id } },
      { new: true, useFindAndModify: false }
    );

    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error sending message', details: err.message });
  }
});

// Get all messages from a chat room (decrypts before sending)
router.get('/:roomId/messages', async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const messages = await Message.find({ chatRoom: req.params.roomId }).sort({ sentAt: 1 });

    const decryptedMessages = messages.map(msg => {
      let displaySender = msg.sender;
      
      // If anonymous mode is currently on, hide real names
      if (room.anonymousMode) {
        // If sender is already anonymous (Batman, etc.), keep it
        // If sender is a real name, show as "Anonymous"
        const isAlreadyAnonymous = anonymousNamePool.includes(msg.sender) || msg.sender.startsWith('Anonymous');
        displaySender = isAlreadyAnonymous ? msg.sender : 'Anonymous';
      }

      return {
        _id: msg._id,
        sender: displaySender,
        text: Message.decryptText(msg.encryptedText, msg.iv),
        sentAt: msg.sentAt
      };
    });

    res.json({ success: true, messages: decryptedMessages, anonymousMode: room.anonymousMode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving messages', details: err.message });
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
