const ChatRoom = require('../models/ChatRoom');

// Create a new chat room
exports.createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const newRoom = await ChatRoom.create({ name, participants: [] });
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Join an existing chat room
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      await room.save();
    }

    res.status(200).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all chat rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find();
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};