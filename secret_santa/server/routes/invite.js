const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

// Generate unique invite code
function generateInviteCode() {
  return crypto.randomBytes(8).toString('hex');
}

// Generate/Get Invite Link for a Room
router.get('/room/:roomId/invite', protect, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is admin
  if (room.admin.toString() !== req.user.id) {
    throw new AppError('Only room admin can generate invite links', 403);
  }

  // Generate invite code if doesn't exist
  if (!room.inviteCode) {
    room.inviteCode = generateInviteCode();
    await room.save();
  }

  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${room.inviteCode}`;

  res.json({
    success: true,
    inviteCode: room.inviteCode,
    inviteLink: inviteLink,
    roomName: room.roomName
  });
}));

// Get Room Info by Invite Code (for preview before joining)
router.get('/join/:inviteCode', asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const room = await Room.findOne({ inviteCode })
    .populate('admin', 'username')
    .select('roomName description admin participants maxParticipants theme drawDate');

  if (!room) {
    throw new AppError('Invalid invite link', 404);
  }

  res.json({
    success: true,
    room: {
      _id: room._id,
      roomName: room.roomName,
      description: room.description,
      admin: room.admin.username,
      participantCount: room.participants.length,
      maxParticipants: room.maxParticipants,
      theme: room.theme,
      drawDate: room.drawDate
    }
  });
}));

// Join Room via Invite Code
router.post('/join/:inviteCode', protect, asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const userId = req.user.id;

  const room = await Room.findOne({ inviteCode });

  if (!room) {
    throw new AppError('Invalid invite link', 404);
  }

  // Check if already a participant
  if (room.participants.some(p => p.toString() === userId)) {
    throw new AppError('You are already a member of this room', 400);
  }

  // Check if room is full
  if (room.participants.length >= room.maxParticipants) {
    throw new AppError('This room is full', 400);
  }

  // Add user to participants
  room.participants.push(userId);
  await room.save();

  res.json({
    success: true,
    message: 'Successfully joined the room!',
    room: {
      _id: room._id,
      roomName: room.roomName,
      description: room.description
    }
  });
}));

// Regenerate Invite Code (invalidates old link)
router.post('/room/:roomId/invite/regenerate', protect, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is admin
  if (room.admin.toString() !== req.user.id) {
    throw new AppError('Only room admin can regenerate invite links', 403);
  }

  // Generate new invite code
  room.inviteCode = generateInviteCode();
  await room.save();

  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${room.inviteCode}`;

  res.json({
    success: true,
    inviteCode: room.inviteCode,
    inviteLink: inviteLink,
    message: 'Invite link regenerated successfully'
  });
}));

module.exports = router;