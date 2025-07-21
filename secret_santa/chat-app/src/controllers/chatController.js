const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

// Send a message to a chat room
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { sender, text } = req.body;

    const message = await Message.create({
      chatRoom: roomId,
      sender,
      text,
      sentAt: new Date()
    });

    await ChatRoom.findByIdAndUpdate(roomId, { $push: { messages: message._id } });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all messages from a chat room
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ chatRoom: roomId }).sort({ sentAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};