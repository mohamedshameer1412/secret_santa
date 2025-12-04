const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Village = require('../models/Village');
const User = require('../models/User');

// @route   GET /api/village
// @desc    Get user's village members
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  let village = await Village.findOne({ userId: req.user.id });
  
  // Create village with empty members if doesn't exist
  if (!village) {
    village = new Village({
      userId: req.user.id,
      members: []
    });
    await village.save();
  }
  
  res.json({
    success: true,
    members: village.members
  });
}));

// @route   POST /api/village
// @desc    Add member to village
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
  const { userId, name, profilePic, isChild } = req.body;
  
  if (!userId || !name) {
    throw new AppError('User ID and name are required', 400);
  }
  
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  let village = await Village.findOne({ userId: req.user.id });
  
  if (!village) {
    village = new Village({ userId: req.user.id, members: [] });
  }
  
  // Check if member already exists
  const memberExists = village.members.some(m => m.userId.toString() === userId);
  if (memberExists) {
    throw new AppError('Member already in your village', 400);
  }
  
  const newMember = {
    userId,
    name,
    profilePic: profilePic || user.profilePic || 'https://i.pravatar.cc/150?img=1',
    isChild: isChild || false
  };
  
  village.members.push(newMember);
  await village.save();
  
  const addedMember = village.members[village.members.length - 1];
  
  res.status(201).json({
    success: true,
    message: 'Member added successfully',
    member: {
      _id: addedMember._id,
      userId: addedMember.userId,
      name: addedMember.name,
      profilePic: addedMember.profilePic,
      isChild: addedMember.isChild
    }
  });
}));

// @route   PUT /api/village/:memberId
// @desc    Update village member
// @access  Private
router.put('/:memberId', protect, asyncHandler(async (req, res) => {
  const { name, profilePic, isChild } = req.body;
  
  const village = await Village.findOne({ userId: req.user.id });
  
  if (!village) {
    throw new AppError('Village not found', 404);
  }
  
  const member = village.members.id(req.params.memberId);
  
  if (!member) {
    throw new AppError('Member not found', 404);
  }
  
  // Update fields
  if (name !== undefined) member.name = name;
  if (profilePic !== undefined) member.profilePic = profilePic;
  if (isChild !== undefined) member.isChild = isChild;
  
  await village.save();
  
  res.json({
    success: true,
    message: 'Member updated successfully',
    member: {
      _id: member._id,
      userId: member.userId,
      name: member.name,
      profilePic: member.profilePic,
      isChild: member.isChild
    }
  });
}));

// @route   DELETE /api/village/:memberId
// @desc    Remove member from village
// @access  Private
router.delete('/:memberId', protect, asyncHandler(async (req, res) => {
  const village = await Village.findOne({ userId: req.user.id });
  
  if (!village) {
    throw new AppError('Village not found', 404);
  }
  
  const member = village.members.id(req.params.memberId);
  
  if (!member) {
    throw new AppError('Member not found', 404);
  }
  
  village.members.pull(req.params.memberId);
  await village.save();
  
  res.json({
    success: true,
    message: 'Member removed successfully'
  });
}));

// @route   GET /api/village/search
// @desc    Search for users to add to village
// @access  Private
router.get('/search', protect, asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400);
  }
  
  // Search users by name or email (excluding current user)
  const users = await User.find({
    _id: { $ne: req.user.id },
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { username: { $regex: query, $options: 'i' } }
    ]
  }).select('name username email profilePic').limit(10);
  
  res.json({
    success: true,
    users
  });
}));

module.exports = router;