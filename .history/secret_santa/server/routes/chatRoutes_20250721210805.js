const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom'); // ✅ Required for updating the room's messages

// Send a message to a chat room (encrypts before saving)
router.post('/:roomId/message', async (req, res) => {
  try {
    const { sender, text } = req.body;
    if (!sender || !text) {
      return res.status(400).json({ error: 'Sender and text are required' });
    }

    const { encryptedText, iv } = Message.encryptText(text); // Static method assumed in model

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
    const messages = await Message.find({ chatRoom: req.params.roomId }).sort({ sentAt: 1 });

    const decryptedMessages = messages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      text: Message.decryptText(msg.encryptedText, msg.iv), // Static method assumed in model
      sentAt: msg.sentAt
    }));

    res.json({ success: true, messages: decryptedMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving messages', details: err.message });
  }
});

module.exports = router;
