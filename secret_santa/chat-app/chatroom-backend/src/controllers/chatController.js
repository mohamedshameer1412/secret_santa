const ChatRoom = require('../models/room');
const User = require('../models/user');

// Create a new chat room
exports.createRoom = async (req, res) => {
    const { roomName } = req.body;
    try {
        const newRoom = await ChatRoom.create({ name: roomName });
        res.status(201).json(newRoom);
    } catch (error) {
        res.status(500).json({ message: 'Error creating room', error });
    }
};

// Join an existing chat room
exports.joinRoom = async (req, res) => {
    const { roomId, userId } = req.body;
    try {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        room.participants.push(userId);
        await room.save();
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error joining room', error });
    }
};

// Send a message in a chat room
exports.sendMessage = async (req, res) => {
    const { roomId, userId, message } = req.body;
    try {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        const chatMessage = { userId, message, timestamp: new Date() };
        room.messages.push(chatMessage);
        await room.save();
        res.status(200).json(chatMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error });
    }
};

// Get messages from a chat room
exports.getMessages = async (req, res) => {
    const { roomId } = req.params;
    try {
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.status(200).json(room.messages);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving messages', error });
    }
};