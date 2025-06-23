const jwt = require('jsonwebtoken');

// After verifying email and password...
const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
  expiresIn: '7d',
});

// 🍪 Set cookie
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

res.status(200).json({ message: 'Login successful', user: { id: user._id, email: user.email, name: user.name } });
// 🍪 Clear cookie
res.clearCookie('token', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
});

res.status(200).json({ message: 'Logged out' });

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/sendEmail');

// REGISTER
exports.registerUser = async (req, res) => {
  // TODO: validate input, hash password, save user, send verification email
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  // TODO: decode token, activate user
};

// LOGIN
exports.loginUser = async (req, res) => {
  // TODO: check user, match password, generate JWT, set cookie
};

// LOGOUT
exports.logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ message: 'Logged out' });
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  // TODO: generate reset token, send reset email
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  // TODO: verify token, set new hashed password
};
