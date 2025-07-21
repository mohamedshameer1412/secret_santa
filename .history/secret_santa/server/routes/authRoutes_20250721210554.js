const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();

const {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  getCurrentUser
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

// 📌 Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ✅ Register route with validations
router.post(
  '/register',
  [
    body('name').trim().not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  validate,
  registerUser
);

// ✅ Login route with validations
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  validate,
  loginUser
);

// ✅ Email verification
router.get(
  '/verify/:token',
  [param('token').isLength({ min: 40, max: 40 }).withMessage('Invalid verification token')],
  validate,
  verifyEmail
);

// ✅ Forgot password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please include a valid email')],
  validate,
  forgotPassword
);

// ✅ Reset password
router.post(
  '/reset-password/:token',
  [
    param('token').isLength({ min: 40, max: 40 }).withMessage('Invalid reset token'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  validate,
  resetPassword
);

// ✅ Logout route (protected)
router.get('/logout', protect, logout);

// ✅ Get logged-in user profile (protected)
router.get('/me', protect, getCurrentUser);

module.exports = router;
