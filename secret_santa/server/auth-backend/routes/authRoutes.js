const express = require('express');
const {
  registerUser, verifyEmail, loginUser,
  logoutUser, forgotPassword, resetPassword
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.get('/verify/:token', verifyEmail);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;

