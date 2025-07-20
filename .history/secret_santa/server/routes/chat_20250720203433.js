const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

// Send a message to a chat room (encrypts before saving)
router.post('/:roomId/message', async (req, res) => {
  try {
    const { sender, text } = req.body;
    const { encryptedText, iv } = Message.encryptText(text);

    const message = await Message.create({
      chatRoom: req.params.roomId,
      sender,
      encryptedText,
      iv
    });

    await ChatRoom.findByIdAndUpdate(
      req.params.roomId,
      { $push: { messages: message._id } }
    );h

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all messages from a chat room (decrypts before sending)
router.get('/:roomId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ chatRoom: req.params.roomId }).sort({ sentAt: 1 });
    const decryptedMessages = messages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      text: Message.decryptText(msg.encryptedText, msg.iv),
      sentAt: msg.sentAt
    }));
    res.json(decryptedMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;