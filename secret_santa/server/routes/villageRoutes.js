const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Village = require('../models/Village');
const User = require('../models/User');

// @route   GET /api/village
// @desc    Get user's village members
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let village = await Village.findOne({ userId: req.user.id });
    
    // Create village with sample data if doesn't exist
    if (!village) {
      village = new Village({
        userId: req.user.id,
        members: [
          //  Commented sample data (can be uncommented for testing)
          // {
          //   userId: new mongoose.Types.ObjectId(), // Fake ID for demo
          //   name: "Anita Rao",
          //   profilePic: "https://i.pravatar.cc/150?img=1",
          //   isChild: true
          // },
          // {
          //   userId: new mongoose.Types.ObjectId(),
          //   name: "Ramesh Singh",
          //   profilePic: "https://i.pravatar.cc/150?img=2",
          //   isChild: false
          // },
          // {
          //   userId: new mongoose.Types.ObjectId(),
          //   name: "Meena Kumari",
          //   profilePic: "https://i.pravatar.cc/150?img=3",
          //   isChild: false
          // },
          // {
          //   userId: new mongoose.Types.ObjectId(),
          //   name: "Kiran Patel",
          //   profilePic: "https://i.pravatar.cc/150?img=4",
          //   isChild: false
          // }
        ]
      });
      await village.save();
    }
    
    res.json({ members: village.members });
  } catch (error) {
    console.error('Error fetching village:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/village
// @desc    Add member to village
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { userId, name, profilePic, isChild } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ message: 'User ID and name are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let village = await Village.findOne({ userId: req.user.id });
    
    if (!village) {
      village = new Village({ userId: req.user.id, members: [] });
    }
    
    // Check if member already exists
    const memberExists = village.members.some(m => m.userId.toString() === userId);
    if (memberExists) {
      return res.status(400).json({ message: 'Member already in your village' });
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
      message: 'Member added successfully',
      member: {
        _id: addedMember._id,
        userId: addedMember.userId,
        name: addedMember.name,
        profilePic: addedMember.profilePic,
        isChild: addedMember.isChild
      }
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/village/:memberId
// @desc    Update village member
// @access  Private
router.put('/:memberId', protect, async (req, res) => {
  try {
    const { name, profilePic, isChild } = req.body;
    
    const village = await Village.findOne({ userId: req.user.id });
    
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }
    
    const member = village.members.id(req.params.memberId);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Update fields
    if (name !== undefined) member.name = name;
    if (profilePic !== undefined) member.profilePic = profilePic;
    if (isChild !== undefined) member.isChild = isChild;
    
    await village.save();
    
    res.json({ 
      message: 'Member updated successfully',
      member: {
        _id: member._id,
        userId: member.userId,
        name: member.name,
        profilePic: member.profilePic,
        isChild: member.isChild
      }
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/village/:memberId
// @desc    Remove member from village
// @access  Private
router.delete('/:memberId', protect, async (req, res) => {
  try {
    const village = await Village.findOne({ userId: req.user.id });
    
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }
    
    const member = village.members.id(req.params.memberId);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    village.members.pull(req.params.memberId);
    await village.save();
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/village/search
// @desc    Search for users to add to village
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    // Search users by name or email (excluding current user)
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email profilePic').limit(10);
    
    res.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;