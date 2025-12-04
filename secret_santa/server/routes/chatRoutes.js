const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/chat-files');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: images, videos, documents'));
        }
    }
});

// Anonymous name pool
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

// @route   POST /api/chat/create-room
// @desc    Create a new chat room
// @access  Private
router.post('/create-room', protect, asyncHandler(async (req, res) => {
    const { name } = req.body;
    
    const room = await ChatRoom.createRoom(name || 'New Chat Room', req.user.id);
    
    res.json({
        success: true,
        room
    });
}));

// @route   GET /api/chat/my-rooms
// @desc    Get all rooms for current user
// @access  Private
router.get('/my-rooms', protect, asyncHandler(async (req, res) => {
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
            messageCount: room.messages ? room.messages.length : 0,
            createdAt: room.createdAt
        }))
    });
}));

// @route   GET /api/chat/:roomId
// @desc    Get specific room by ID
// @access  Private
router.get('/:roomId', protect, asyncHandler(async (req, res) => {
    const room = await ChatRoom.findById(req.params.roomId)
        .populate('organizer', 'name email username')
        .populate('participants', 'name email username profilePic');

    if (!room) {
        throw new AppError('Room not found', 404);
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
        p => p._id.toString() === req.user.id
    );

    if (!isParticipant) {
        throw new AppError('You are not a participant in this room', 403);
    }

    res.json({
        success: true,
        room
    });
}));

// @route   GET /api/chat/:roomId/messages
// @desc    Get all messages from a chat room (decrypts before sending)
// @access  Private
router.get('/:roomId/messages', protect, asyncHandler(async (req, res) => {
    const room = await ChatRoom.findById(req.params.roomId);

    if (!room) {
        throw new AppError('Room not found', 404);
    }

    const isParticipant = room.participants.some(
        p => p.toString() === req.user.id
    );

    if (!isParticipant) {
        throw new AppError('You are not a participant in this room', 403);
    }

    const messages = await Message.find({ roomId: req.params.roomId })
        .populate('sender', 'name username profilePic')
        .sort({ createdAt: 1 })
        .lean();

    // Decrypt all messages (with HMAC verification)
    const decryptedMessages = messages.map(msg => {
        try {
            const decrypted = {
                ...msg,
                text: Message.decryptText(msg.encryptedText, msg.iv, msg.tag)
            };

            // Get anonymous name for sender
            if (room.anonymousNames) {
                decrypted.anonymousName = room.anonymousNames.get(msg.sender._id.toString()) || 'Anonymous';
            }

            // Decrypt attachment if exists
            if (msg.attachment) {
                decrypted.attachment = {
                    ...msg.attachment,
                    url: `/api/chat/file/${msg._id}`,
                    originalName: Message.decryptText(
                        msg.attachment.fileName, 
                        msg.attachment.iv, 
                        msg.attachment.tag
                    )
                };
            }

            // Map reactions with anonymous names
            if (msg.reactions && msg.reactions.length > 0) {
                decrypted.reactions = msg.reactions.map(r => ({
                    emoji: r.emoji,
                    anonymousName: r.anonymousName,
                    isCurrentUser: r.userId.toString() === req.user.id
                }));
            }

            return decrypted;
        } catch (error) {
            console.error('Failed to decrypt message:', msg._id, error.message);
            return {
                ...msg,
                text: '[Message could not be decrypted]',
                anonymousName: 'Anonymous'
            };
        }
    });

    res.json({
        success: true,
        messages: decryptedMessages
    });
}));

// @route   POST /api/chat/:roomId/message
// @desc    Send a message to a chat room (encrypts before saving)
// @access  Private
router.post('/:roomId/message', protect, asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text || !text.trim()) {
        throw new AppError('Message text is required', 400);
    }

    const room = await ChatRoom.findById(req.params.roomId);

    if (!room) {
        throw new AppError('Room not found', 404);
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
        p => p.toString() === req.user.id
    );

    if (!isParticipant) {
        throw new AppError('You are not a participant in this room', 403);
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

    res.json({
        success: true,
        message: populatedMessage
    });
}));

// @route   POST /api/chat/private-room
// @desc    Get or create a private chat room between two users
// @access  Private
router.post('/private-room', protect, asyncHandler(async (req, res) => {
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
        throw new AppError('Other user ID is required', 400);
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
        const User = require('../models/User');
        const otherUser = await User.findById(otherUserId);
        
        if (!otherUser) {
            throw new AppError('User not found', 404);
        }

        room = await ChatRoom.create({
            name: `Private Chat`,
            participants: userIds,
            organizer: req.user.id,
            anonymousMode: false,
            isPrivate: true
        });
    }

    res.json({
        success: true,
        roomId: room._id
    });
}));

// @route   PUT /api/chat/:roomId/anonymous
// @desc    Toggle anonymous mode for a chat room (only organizer)
// @access  Private
router.put('/:roomId/anonymous', protect, asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { anonymousMode } = req.body;
    
    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
        throw new AppError('Room not found', 404);
    }
    
    // Only organizer can toggle
    if (!room.organizer.equals(req.user.id)) {
        throw new AppError('Only organizer can toggle anonymous mode', 403);
    }
    
    room.anonymousMode = anonymousMode;
    await room.save();
    
    res.json({
        success: true,
        anonymousMode: room.anonymousMode
    });
}));

// @route   PUT /api/chat/:roomId/anonymous-name
// @desc    Set custom anonymous name for a user in a room
// @access  Private
router.put('/:roomId/anonymous-name', protect, asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { anonymousName } = req.body;
    
    if (!anonymousName) {
        throw new AppError('Anonymous name is required', 400);
    }
    
    // Use authenticated user's ID instead of from request body
    const userId = req.user.id;
    
    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
        throw new AppError('Room not found', 404);
    }
    
    // Initialize anonymousNames Map if it doesn't exist
    if (!room.anonymousNames) {
        room.anonymousNames = new Map();
    }
    
    // Check if the name is already taken by another user
    const existingUser = Array.from(room.anonymousNames.entries())
        .find(([key, value]) => value === anonymousName && key !== userId.toString());
    
    if (existingUser) {
        throw new AppError('This anonymous name is already taken', 400);
    }
    
    // Set the custom anonymous name
    room.anonymousNames.set(userId.toString(), anonymousName);
    await room.save();
    
    res.json({
        success: true,
        message: `Anonymous name set to "${anonymousName}"`,
        anonymousName
    });
}));

// @route   GET /api/chat/:roomId/anonymous-names
// @desc    Get list of available anonymous names and current user's name
// @access  Private
router.get('/:roomId/anonymous-names', protect, asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
        throw new AppError('Room not found', 404);
    }
    
    const usedNames = room.anonymousNames ? Array.from(room.anonymousNames.values()) : [];
    const currentUserName = room.anonymousNames ? room.anonymousNames.get(userId.toString()) : null;
    const availablePresets = anonymousNamePool.filter(name => !usedNames.includes(name));
    
    res.json({
        success: true,
        currentAnonymousName: currentUserName,
        usedNames,
        availablePresets,
        anonymousMode: room.anonymousMode
    });
}));

// @route   PUT /api/chat/:roomId/message/:messageId
// @desc    Edit a message
// @access  Private
router.put('/:roomId/message/:messageId', protect, asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
        throw new AppError('Message text is required', 400);
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
        throw new AppError('Message not found', 404);
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
        throw new AppError('You can only edit your own messages', 403);
    }

    // Check if message is deleted
    if (message.isDeleted) {
        throw new AppError('Cannot edit deleted message', 400);
    }

    // Save current version to edit history
    message.editHistory.push({
        encryptedText: message.encryptedText,
        iv: message.iv,
        tag: message.tag,
        editedAt: new Date()
    });

    // Encrypt new message
    const { encryptedText, iv, tag } = Message.encryptText(text.trim());
    message.encryptedText = encryptedText;
    message.iv = iv;
    message.tag = tag;
    message.isEdited = true;

    await message.save();

    // Populate and decrypt for response
    const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name username profilePic')
        .lean();
        
    populatedMessage.text = Message.decryptText(
        populatedMessage.encryptedText,
        populatedMessage.iv,
        populatedMessage.tag
    );

    res.json({
        success: true,
        message: populatedMessage
    });
}));

// @route   DELETE /api/chat/:roomId/message/:messageId
// @desc    Delete a message (soft delete)
// @access  Private
router.delete('/:roomId/message/:messageId', protect, asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    
    if (!message) {
        throw new AppError('Message not found', 404);
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
        throw new AppError('You can only delete your own messages', 403);
    }

    // Soft delete
    const deletedMsg = Message.encryptText('[Message deleted]');
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.encryptedText = deletedMsg.encryptedText;
    message.iv = deletedMsg.iv;
    message.tag = deletedMsg.tag;

    await message.save();

    res.json({
        success: true,
        message: 'Message deleted successfully'
    });
}));

// @route   POST /api/chat/:roomId/upload
// @desc    Upload file/image with message
// @access  Private
router.post('/:roomId/upload', protect, upload.single('file'), asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { text } = req.body;

    if (!req.file) {
        throw new AppError('No file uploaded', 400);
    }

    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
        throw new AppError('Room not found', 404);
    }

    const isParticipant = room.participants.some(
        p => p.toString() === req.user.id
    );
    
    if (!isParticipant) {
        throw new AppError('You are not a participant in this room', 403);
    }

    // Encrypt file path
    const { encryptedText: encryptedUrl, iv: fileIv, tag: fileTag } = 
        Message.encryptText(req.file.path);

    // Encrypt filename
    const { encryptedText: encryptedName, iv: nameIv, tag: nameTag } = 
        Message.encryptText(req.file.originalname);

    // Encrypt message text
    const messageText = text || `[File: ${req.file.originalname}]`;
    const { encryptedText, iv, tag } = Message.encryptText(messageText);

    const message = await Message.create({
        roomId,
        sender: req.user.id,
        encryptedText,
        iv,
        tag,
        attachment: {
            encryptedUrl,
            iv: fileIv,
            tag: fileTag,
            fileType: req.file.mimetype.split('/')[0],
            fileName: encryptedName,
            fileSize: req.file.size
        },
        status: 'sent'
    });

    const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name username profilePic')
        .lean();
    
    populatedMessage.text = Message.decryptText(
        populatedMessage.encryptedText,
        populatedMessage.iv,
        populatedMessage.tag
    );

    if (populatedMessage.attachment) {
        populatedMessage.attachment.url = `/api/chat/file/${message._id}`;
        populatedMessage.attachment.originalName = Message.decryptText(
            populatedMessage.attachment.fileName,
            nameIv,
            nameTag
        );
    }

    res.json({
        success: true,
        message: populatedMessage
    });
}));

// @route   GET /api/chat/file/:messageId
// @desc    Serve uploaded files (with authentication)
// @access  Private
router.get('/file/:messageId', protect, asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.messageId);
    
    if (!message || !message.attachment) {
        throw new AppError('File not found', 404);
    }

    // Verify user is participant in room
    const room = await ChatRoom.findById(message.roomId);
    const isParticipant = room.participants.some(
        p => p.toString() === req.user.id
    );
    
    if (!isParticipant) {
        throw new AppError('Access denied', 403);
    }

    // Decrypt file path
    const filePath = Message.decryptText(
        message.attachment.encryptedUrl,
        message.attachment.iv,
        message.attachment.tag
    );

    if (!fs.existsSync(filePath)) {
        throw new AppError('File not found on server', 404);
    }

    res.sendFile(filePath);
}));

// @route   POST /api/chat/:roomId/message/:messageId/reaction
// @desc    Add reaction to message
// @access  Private
router.post('/:roomId/message/:messageId/reaction', protect, asyncHandler(async (req, res) => {
    const { messageId, roomId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
        throw new AppError('Emoji is required', 400);
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
        throw new AppError('Message not found', 404);
    }

    // Get room for anonymous name
    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
        throw new AppError('Room not found', 404);
    }

    // Get or generate anonymous name
    let anonymousName = room.anonymousNames.get(req.user.id.toString());
    if (!anonymousName) {
        const usedNames = Array.from(room.anonymousNames.values());
        const availableNames = anonymousNamePool.filter(name => !usedNames.includes(name));
        anonymousName = availableNames.length > 0 
            ? availableNames[Math.floor(Math.random() * availableNames.length)]
            : `Anonymous${room.anonymousNames.size + 1}`;
        room.anonymousNames.set(req.user.id.toString(), anonymousName);
        await room.save();
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
        r => r.userId.toString() === req.user.id && r.emoji === emoji
    );

    if (existingReaction) {
        // Remove reaction (toggle)
        message.reactions = message.reactions.filter(
            r => !(r.userId.toString() === req.user.id && r.emoji === emoji)
        );
    } else {
        // Add reaction
        message.reactions.push({
            emoji,
            userId: req.user.id,
            anonymousName,
            createdAt: new Date()
        });
    }

    await message.save();

    res.json({
        success: true,
        reactions: message.reactions.map(r => ({
            emoji: r.emoji,
            anonymousName: r.anonymousName,
            isCurrentUser: r.userId.toString() === req.user.id
        }))
    });
}));

module.exports = router;