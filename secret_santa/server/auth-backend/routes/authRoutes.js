const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
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
  validate, // Use the reusable middleware
  authController.register
);

// Login validation
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  validate, // Use the reusable middleware
  authController.login
);

// Email verification
router.get('/verify/:token', authController.verifyEmail);

// Forgot password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please include a valid email')],
  validate, // Use the reusable middleware
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  validate, // Use the reusable middleware
  authController.resetPassword
);

// Logout route - consider adding protection middleware
router.get('/logout', authController.logout);

module.exports = router;