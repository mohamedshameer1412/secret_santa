const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// ======================== GET USER PROFILE ========================
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// ======================== UPDATE USER PROFILE ========================
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, username, profilePic } = req.body;
  
  let user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if email is being changed
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Check if username is being changed
  if (username && username !== user.username) {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      throw new AppError('Username already in use', 400);
    }
  }

  // Update fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (username) user.username = username;
  if (profilePic) user.profilePic = profilePic;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic
    }
  });
});

// ======================== CHANGE PASSWORD ========================
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password (will be hashed by pre-save middleware)
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// ======================== DELETE USER ACCOUNT ========================
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await User.findByIdAndDelete(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'User account deleted successfully'
  });
});

// ======================== ADMIN: GET ALL USERS ========================
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// ======================== ADMIN: GET SINGLE USER ========================
exports.getSingleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});