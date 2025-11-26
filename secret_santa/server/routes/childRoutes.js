const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Child = require('../models/Child');

// Authentic child names with Indian/diverse backgrounds
const CHILD_NAMES = [
  "Aryan", "Meena", "Ravi", "Lila", "Nisha", "Ayaan",
  "Priya", "Rohan", "Kavya", "Aditya", "Zara", "Ishaan",
  "Ananya", "Kabir", "Diya", "Arnav", "Saanvi", "Vihaan"
];

// Clue templates for authentic mystery-solving experience
const CLUE_TEMPLATES = [
  "I love playing {activity} after school.",
  "My favorite color is {color}.",
  "I have a pet {pet} at home.",
  "I want to be a {profession} when I grow up.",
  "My favorite food is {food}.",
  "I live in a {housing} with my family.",
  "I speak {language} at home.",
  "My favorite subject is {subject}.",
  "I enjoy {hobby} on weekends.",
  "I have {siblings} siblings."
];

const CLUE_DATA = {
  activity: ["cricket", "football", "badminton", "dancing", "singing"],
  color: ["blue", "pink", "green", "yellow", "purple"],
  pet: ["dog", "cat", "parrot", "fish", "rabbit"],
  profession: ["doctor", "teacher", "engineer", "artist", "scientist"],
  food: ["biryani", "pizza", "dosa", "pasta", "samosa"],
  housing: ["apartment", "house", "villa", "farmhouse"],
  language: ["Hindi", "Tamil", "Bengali", "Telugu", "Marathi"],
  subject: ["Math", "Science", "English", "Art", "Sports"],
  hobby: ["reading", "drawing", "cycling", "gardening", "cooking"],
  siblings: ["1", "2", "3", "no"]
};

// Generate random clue
const generateClue = () => {
  const template = CLUE_TEMPLATES[Math.floor(Math.random() * CLUE_TEMPLATES.length)];
  let clue = template;
  
  // Replace placeholders with random values
  Object.keys(CLUE_DATA).forEach(key => {
    if (clue.includes(`{${key}}`)) {
      const value = CLUE_DATA[key][Math.floor(Math.random() * CLUE_DATA[key].length)];
      clue = clue.replace(`{${key}}`, value);
    }
  });
  
  return clue;
};

// @route   POST /api/children/reveal
// @desc    Generate/reveal a new secret child
// @access  Private
router.post('/reveal', protect, async (req, res) => {
  try {
    // Check if user already has an active child (revealed in last 7 days)
    const existingChild = await Child.findOne({
      userId: req.user.id,
      revealedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ revealedAt: -1 });

    if (existingChild) {
      return res.status(400).json({ 
        error: 'You already have an active child. Wait 7 days to reveal a new one.',
        child: existingChild
      });
    }

    // Generate random child data
    const randomName = CHILD_NAMES[Math.floor(Math.random() * CHILD_NAMES.length)];
    const randomAge = Math.floor(Math.random() * 11) + 5; // 5-15 years old
    const randomAvatar = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`;

    // Generate initial clue
    const initialClue = {
      text: generateClue()
    };

    // Create new child
    const child = await Child.create({
      userId: req.user.id,
      name: randomName,
      age: randomAge,
      avatar: randomAvatar,
      clues: [initialClue],
      dare: null
    });

    res.json({ 
      success: true, 
      child,
      message: `You've been matched with ${randomName}, age ${randomAge}!`
    });
  } catch (error) {
    console.error('Error revealing child:', error);
    res.status(500).json({ error: 'Error revealing child', details: error.message });
  }
});

// @route   GET /api/children/current
// @desc    Get current active child
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    const child = await Child.findOne({ userId: req.user.id })
      .sort({ revealedAt: -1 });

    if (!child) {
      return res.status(404).json({ error: 'No child found. Generate one first!' });
    }

    res.json({ success: true, child });
  } catch (error) {
    console.error('Error fetching child:', error);
    res.status(500).json({ error: 'Error fetching child' });
  }
});

// @route   GET /api/children/all
// @desc    Get all children (history)
// @access  Private
router.get('/all', protect, async (req, res) => {
  try {
    const children = await Child.find({ userId: req.user.id })
      .sort({ revealedAt: -1 });

    res.json({ success: true, children });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ error: 'Error fetching children' });
  }
});

// @route   POST /api/children/:childId/clue
// @desc    Reveal next clue (unlocks every 24 hours)
// @access  Private
router.post('/:childId/clue', protect, async (req, res) => {
  try {
    const child = await Child.findOne({ 
      _id: req.params.childId,
      userId: req.user.id 
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Check if enough time has passed for next clue
    if (new Date() < child.nextClueAt) {
      const hoursLeft = Math.ceil((child.nextClueAt - new Date()) / (1000 * 60 * 60));
      return res.status(400).json({ 
        error: `Next clue unlocks in ${hoursLeft} hour(s)`,
        nextClueAt: child.nextClueAt
      });
    }

    // Generate and add new clue
    const newClue = {
      text: generateClue()
    };

    child.clues.push(newClue);
    child.nextClueAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next clue in 24 hours
    await child.save();

    res.json({ 
      success: true, 
      clue: newClue,
      child,
      message: 'New clue revealed!'
    });
  } catch (error) {
    console.error('Error revealing clue:', error);
    res.status(500).json({ error: 'Error revealing clue' });
  }
});

// @route   POST /api/children/:childId/dare
// @desc    Submit dare proof
// @access  Private
router.post('/:childId/dare', protect, async (req, res) => {
  try {
    const { proofUrl } = req.body;

    const child = await Child.findOne({ 
      _id: req.params.childId,
      userId: req.user.id 
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (!child.dare || !child.dare.text) {
      return res.status(400).json({ error: 'No dare assigned yet' });
    }

    child.dare.proof = proofUrl;
    child.dare.completed = true;
    child.dare.submittedAt = new Date();
    await child.save();

    res.json({ 
      success: true, 
      child,
      message: 'Dare completed! Well done!'
    });
  } catch (error) {
    console.error('Error submitting dare:', error);
    res.status(500).json({ error: 'Error submitting dare proof' });
  }
});

// @route   GET /api/children/stats
// @desc    Get user's child statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const children = await Child.find({ userId: req.user.id });

    const stats = {
      totalChildren: children.length,
      totalCluesRevealed: children.reduce((sum, child) => sum + child.clues.length, 0),
      completedDares: children.filter(c => c.dare?.completed).length,
      lastRevealed: children.length > 0 
        ? children.sort((a, b) => b.revealedAt - a.revealedAt)[0].revealedAt 
        : null
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

module.exports = router;