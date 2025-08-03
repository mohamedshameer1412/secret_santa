const ChatRoom = require('../models/room');

// Create a new chat room
exports.createRoom = async (req, res) => {
  const { roomName } = req.body;
  try {
    const newRoom = await ChatRoom.create({
      name: roomName,
      participants: [req.user.id],
      messages: []
    });
    res.status(201).json(newRoom);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error creating room' });
  }
};

// Join an existing chat room
exports.joinRoom = async (req, res) => {
  const { roomId } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (!room.participants.includes(req.user.id)) {
      room.participants.push(req.user.id);
      await room.save();
    }
    res.json(room);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error joining room' });
  }
};

// Send a message (only if you’re in the room)
exports.sendMessage = async (req, res) => {
  const { roomId, message } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not in room' });
    }

    const chatMessage = { user: req.user.id, message, timestamp: new Date() };
    room.messages.push(chatMessage);
    await room.save();

    res.json(chatMessage);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error sending message' });
  }
};

// Get messages, but only for participants
exports.getMessages = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not in room' });
    }
    res.json(room.messages);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error retrieving messages' });
  }
};
