const express = require('express');
const router = express.Router();
const DareController = require('../controllers/dareController');

// Create a new dare
router.post('/', DareController.createDare);

// Get all dares
router.get('/', DareController.getAllDares);

// Get a specific dare by ID
router.get('/:id', DareController.getDareById);

// Update a dare
router.put('/:id', DareController.updateDare);

// Delete a dare
router.delete('/:id', DareController.deleteDare);

module.exports = router;