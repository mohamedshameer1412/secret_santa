const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/sendEmail');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Utility: Send token as HTTP-only cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { user: { id: user._id, role: user.role } },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000)
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        role: user.role
      }
    });
};

// ======================== REGISTER ========================
exports.register = asyncHandler(async (req, res, next) => {
  const { name, username, email, password } = req.body;
  
  // Check for existing user
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Username';
    throw new AppError(`${field} already exists`, 400);
  }

  // Create verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  const verificationExpires = Date.now() + 3600000; // 1 hour

  // Create user
  const user = new User({
    name,
    username,
    email,
    password,
    isVerified: false,
    verificationToken,
    verificationExpires
  });

  await user.save();

  // Send verification email
  const verifyURL = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/verify-email/${verificationToken}`;
  
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #cc0000;">🎅 Welcome to Secret Santa!</h1>
      <p>Hi ${name},</p>
      <p>Please verify your email to get started:</p>
      <a href="${verifyURL}" style="display: inline-block; padding: 12px 24px; background: #cc0000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
      <p style="color: #666; margin-top: 20px;">This link expires in 1 hour.</p>
      <p style="color: #999; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
    </div>
  `;
  
  await sendEmail(email, 'Verify Your Email - Secret Santa', message);

  res.status(201).json({ 
    success: true,
    message: 'Registration successful! Please check your email to verify your account.' 
  });
});

// ======================== VERIFY EMAIL ========================
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  
  console.log('Verifying token:', token);
  
  const user = await User.findOne({
    verificationToken: token,
    verificationExpires: { $gt: Date.now() }
  });

  console.log('User found:', user ? 'Yes' : 'No');

  if (!user) {
    console.log('Invalid or expired token');
    const loginURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?verified=error`;
    return res.redirect(loginURL);
  }

  // Mark user as verified
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();
  
  console.log('User verified successfully:', user.email);

  // Redirect to login with success
  const loginURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?verified=success`;
  res.redirect(loginURL);
});

// ======================== LOGIN ========================
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ 
    email: { $regex: new RegExp(`^${email}$`, 'i') } 
  }).select('+password');
  
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if email is verified
  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 401);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  sendTokenResponse(user, 200, res);
});

// ======================== LOGOUT ========================
exports.logout = asyncHandler(async (req, res, next) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.status(200).json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

// ======================== CURRENT USER ========================
exports.getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.status(200).json({ 
    success: true, 
    data: user 
  });
});

// ======================== FORGOT PASSWORD ========================
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    throw new AppError('No user found with that email', 404);
  }

  // Create reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send email
  const resetURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #cc0000;">🎅 Password Reset</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetURL}" style="display: inline-block; padding: 12px 24px; background: #cc0000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
      <p style="color: #666; margin-top: 20px;">This link expires in 1 hour.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail(user.email, 'Password Reset Request - Secret Santa', message);
  
  res.status(200).json({ 
    success: true,
    message: 'Password reset email sent' 
  });
});

// ======================== RESET PASSWORD ========================
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Set new password
  user.password = password;
  user.isVerified = true;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ 
    success: true,
    message: 'Password reset successful. You can now log in.' 
  });
});