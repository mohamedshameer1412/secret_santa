const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation middleware - extract to be reusable
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Registration validation
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
  authController.register
);

// Login validation
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  validate,
  authController.login
);

// Email verification with token validation
router.get(
  '/verify/:token',
  [
    param('token').isLength({ min: 40, max: 40 }).withMessage('Invalid verification token')
  ],
  validate,
  authController.verifyEmail
);

// Forgot password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please include a valid email')],
  validate,
  authController.forgotPassword
);

// Reset password with token validation
router.post(
  '/reset-password/:token',
  [
    param('token').isLength({ min: 40, max: 40 }).withMessage('Invalid reset token'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  validate,
  authController.resetPassword
);

// Protected routes
router.get('/logout', protect, authController.logout);

// Get current user profile (new route)
router.get('/me', protect, authController.getCurrentUser);

module.exports = router;