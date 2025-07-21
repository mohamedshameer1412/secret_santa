const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUser,
  getAllUsers,
  getSingleUser,
} = require('../controllers/userController');

const router = express.Router();

router.get('/me', protect, getUserProfile);
router.put('/update', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.delete('/delete', protect, deleteUser);

// Admin only
router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id', protect, adminOnly, getSingleUser);

module.exports = router;

