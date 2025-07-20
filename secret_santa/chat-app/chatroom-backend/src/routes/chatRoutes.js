const express = require('express');
const { sendMessage, getMessages, createRoom, joinRoom } = require('../controllers/chatController');

const router = express.Router();

// Route for sending a message
router.post('/send', sendMessage);

// Route for retrieving messages
router.get('/messages/:roomId', getMessages);

// Route for creating a chat room
router.post('/rooms', createRoom);

// Route for joining a chat room
router.post('/rooms/join', joinRoom);

module.exports = router;