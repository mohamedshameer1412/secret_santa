const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

// Create a new event
router.post('/', auth, eventController.createEvent);

// Get all events organized by the user
router.get('/my-events', auth, eventController.getMyEvents);

// Get events user is participating in
router.get('/participating', auth, eventController.getParticipatingEvents);

// Get a single event
router.get('/:id', auth, eventController.getEvent);

// Draw names for Secret Santa
router.post('/:id/draw', auth, eventController.drawNames);

// ADDITIONAL ENDPOINTS

// Allow participants to confirm participation
router.post('/:id/confirm', auth, eventController.confirmParticipation);

// Update participant wishlist
router.put('/:eventId/wishlist', auth, eventController.updateWishlist);

// Update event details
router.put('/:id', auth, eventController.updateEvent);

// Delete an event
router.delete('/:id', auth, eventController.deleteEvent);

// Add additional participants
router.post('/:id/participants', auth, eventController.addParticipants);

// Remove a participant
router.delete('/:eventId/participants/:participantId', auth, eventController.removeParticipant);

module.exports = router;