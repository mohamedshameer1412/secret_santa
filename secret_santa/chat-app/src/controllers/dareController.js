const express = require('express');
const Dare = require('../models/Dare');
const { generateClue } = require('../utils/clueUtils');

const router = express.Router();

// Create a new dare
router.post('/', async (req, res) => {
  try {
    const { description, clues } = req.body;
    const dare = await Dare.create({ description, clues });
    res.status(201).json(dare);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all dares
router.get('/', async (req, res) => {
  try {
    const dares = await Dare.find();
    res.json(dares);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign a dare to a user
router.post('/:dareId/assign', async (req, res) => {
  try {
    const { userId } = req.body;
    const dare = await Dare.findById(req.params.dareId);
    if (!dare) {
      return res.status(404).json({ error: 'Dare not found' });
    }
    // Logic to assign the dare to the user (e.g., save to user model)
    // This is a placeholder for the actual assignment logic
    res.json({ message: 'Dare assigned successfully', dare });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate a clue for a dare
router.get('/:dareId/clue', async (req, res) => {
  try {
    const dare = await Dare.findById(req.params.dareId);
    if (!dare) {
      return res.status(404).json({ error: 'Dare not found' });
    }
    const clue = generateClue(dare.clues);
    res.json({ clue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;