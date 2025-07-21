const express = require('express');
const router = express.Router();
const dareController = require('../controllers/dareController');

// Route to create a new dare
router.post('/dare', dareController.createDare);

// Route to get all dares
router.get('/dares', dareController.getAllDares);

// Route to get a specific dare by ID
router.get('/dare/:id', dareController.getDareById);

// Route to assign a dare to a user
router.post('/dare/assign', dareController.assignDare);

module.exports = router;