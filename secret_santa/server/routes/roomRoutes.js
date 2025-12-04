const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Create a new room
router.post('/create', protect, asyncHandler(async (req, res) => {
  const { roomName, description, maxParticipants, drawDate, giftBudget, theme, isPrivate, allowWishlist, allowChat } = req.body;
  const adminId = req.user.id;

  // Validation
  if (!roomName || roomName.trim().length === 0) {
    throw new AppError('Room name is required', 400);
  }

  // Create room with admin as first participant
  const room = await Room.createRoom({
    roomName: roomName.trim(),
    description: description?.trim(),
    maxParticipants: maxParticipants || 20,
    drawDate,
    giftBudget: giftBudget || 50,
    theme: theme || 'christmas',
    isPrivate: isPrivate || false,
    allowWishlist: allowWishlist !== false, // Default true
    allowChat: allowChat !== false // Default true
  }, adminId);

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    room: {
      _id: room._id,
      roomName: room.roomName,
      description: room.description,
      admin: room.admin,
      participants: room.participants,
      maxParticipants: room.maxParticipants,
      drawDate: room.drawDate,
      giftBudget: room.giftBudget,
      theme: room.theme,
      inviteCode: room.inviteCode,
      createdAt: room.createdAt
    }
  });
}));

// Get all rooms the user is part of
router.get('/my-rooms', protect, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const rooms = await Room.find({
    participants: userId
  })
    .populate('admin', 'username profilePic')
    .select('roomName description admin participants maxParticipants theme drawDate status createdAt')
    .sort({ createdAt: -1 });

  // Add isAdmin flag for each room
  const roomsWithAdminFlag = rooms.map(room => ({
    _id: room._id,
    roomName: room.roomName,
    description: room.description,
    admin: room.admin,
    participantCount: room.participants.length,
    maxParticipants: room.maxParticipants,
    theme: room.theme,
    drawDate: room.drawDate,
    status: room.status,
    createdAt: room.createdAt,
    isAdmin: room.admin._id.toString() === userId
  }));

  res.json({
    success: true,
    rooms: roomsWithAdminFlag
  });
}));

// Get specific room details
router.get('/:roomId', protect, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const room = await Room.getRoomWithDetails(roomId);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is participant
  const isParticipant = room.participants.some(p => p._id.toString() === userId);
  if (!isParticipant) {
    throw new AppError('You do not have access to this room', 403);
  }

  res.json({
    success: true,
    room: {
      _id: room._id,
      roomName: room.roomName,
      description: room.description,
      admin: room.admin,
      participants: room.participants,
      maxParticipants: room.maxParticipants,
      drawDate: room.drawDate,
      giftBudget: room.giftBudget,
      theme: room.theme,
      status: room.status,
      isPrivate: room.isPrivate,
      allowWishlist: room.allowWishlist,
      allowChat: room.allowChat,
      inviteCode: room.inviteCode,
      pairings: room.pairings,
      chatRoom: room.chatRoom,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      isAdmin: room.admin._id.toString() === userId
    }
  });
}));

// Update room settings (admin only)
router.put('/:roomId/settings', protect, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;
  const { roomName, description, maxParticipants, drawDate, giftBudget, theme, isPrivate, allowWishlist, allowChat } = req.body;

  const room = await Room.findById(roomId);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is admin
  if (room.admin.toString() !== userId) {
    throw new AppError('Only room admin can update settings', 403);
  }

  // Update fields
  if (roomName) room.roomName = roomName.trim();
  if (description !== undefined) room.description = description?.trim();
  if (maxParticipants !== undefined) {
    // Ensure maxParticipants is not less than current participants
    if (maxParticipants < room.participants.length) {
      throw new AppError(`Cannot set max participants below current participant count (${room.participants.length})`, 400);
    }
    room.maxParticipants = maxParticipants;
  }
  if (drawDate !== undefined) room.drawDate = drawDate;
  if (giftBudget !== undefined) room.giftBudget = giftBudget;
  if (theme) room.theme = theme;
  if (isPrivate !== undefined) room.isPrivate = isPrivate;
  if (allowWishlist !== undefined) room.allowWishlist = allowWishlist;
  if (allowChat !== undefined) room.allowChat = allowChat;

  await room.save();

  res.json({
    success: true,
    message: 'Room settings updated successfully',
    room: {
      _id: room._id,
      roomName: room.roomName,
      description: room.description,
      maxParticipants: room.maxParticipants,
      drawDate: room.drawDate,
      giftBudget: room.giftBudget,
      theme: room.theme,
      isPrivate: room.isPrivate,
      allowWishlist: room.allowWishlist,
      allowChat: room.allowChat,
      updatedAt: room.updatedAt
    }
  });
}));

// Delete room (admin only)
router.delete('/:roomId', protect, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const room = await Room.findById(roomId);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is admin
  if (room.admin.toString() !== userId) {
    throw new AppError('Only room admin can delete the room', 403);
  }

  await Room.findByIdAndDelete(roomId);

  res.json({
    success: true,
    message: 'Room deleted successfully'
  });
}));

// Remove participant from room (admin only)
router.delete('/:roomId/participants/:userId', protect, asyncHandler(async (req, res) => {
  const { roomId, userId: targetUserId } = req.params;
  const adminId = req.user.id;

  const room = await Room.findById(roomId);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is admin
  if (room.admin.toString() !== adminId) {
    throw new AppError('Only room admin can remove participants', 403);
  }

  // Cannot remove admin
  if (targetUserId === adminId) {
    throw new AppError('Admin cannot be removed from the room', 400);
  }

  // Check if user is actually a participant
  const participantIndex = room.participants.findIndex(p => p.toString() === targetUserId);
  if (participantIndex === -1) {
    throw new AppError('User is not a participant in this room', 404);
  }

  // Remove participant
  room.participants.splice(participantIndex, 1);
  await room.save();

  res.json({
    success: true,
    message: 'Participant removed successfully'
  });
}));

// Leave room (participant only, not admin)
router.post('/:roomId/leave', protect, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const room = await Room.findById(roomId);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is admin
  if (room.admin.toString() === userId) {
    throw new AppError('Admin cannot leave the room. Transfer admin rights or delete the room instead.', 400);
  }

  // Check if user is participant
  const participantIndex = room.participants.findIndex(p => p.toString() === userId);
  if (participantIndex === -1) {
    throw new AppError('You are not a participant in this room', 404);
  }

  // Remove participant
  room.participants.splice(participantIndex, 1);
  await room.save();

  res.json({
    success: true,
    message: 'Successfully left the room'
  });
}));

module.exports = router;