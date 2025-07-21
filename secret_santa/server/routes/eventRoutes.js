const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Create event validation
router.post(
  '/',
  protect,
  [
    body('name').trim().not().isEmpty().withMessage('Event name is required'),
    body('date').isDate().withMessage('Valid event date is required'),
    body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    body('participants').optional().isArray().withMessage('Participants must be an array')
  ],
  validate,
  eventController.createEvent
);

// Join event validation
router.post(
  '/join/:eventId',
  protect,
  [
    param('eventId').isMongoId().withMessage('Invalid event ID')
  ],
  validate,
  eventController.joinEvent
);

// Update event validation
router.put(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid event ID'),
    body('name').optional().trim().not().isEmpty().withMessage('Event name cannot be empty'),
    body('date').optional().isDate().withMessage('Valid event date is required'),
    body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number')
  ],
  validate,
  eventController.updateEvent
);

// Get single event
router.get(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid event ID')
  ],
  validate,
  eventController.getEvent
);

// Get wishlist for a participant
router.get(
  '/:eventId/participants/:participantId/wishlist',
  protect,
  [
    param('eventId').isMongoId().withMessage('Invalid event ID'),
    param('participantId').isMongoId().withMessage('Invalid participant ID')
  ],
  validate,
  async (req, res) => {
    try {
      const Event = require('../models/Event');
      const event = await Event.findById(req.params.eventId);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const participant = event.participants.id(req.params.participantId);
      if (!participant) return res.status(404).json({ message: 'Participant not found' });

      // Authorization: Only the participant themselves or their ChrisMom can view
      const isParticipantThemselves = participant.user && participant.user.equals(req.user.id);
      const isChrisMom = event.participants.some(
        p => p.giftFor && p.giftFor.equals(participant._id) && p.user && p.user.equals(req.user.id)
      );

      if (!isParticipantThemselves && !isChrisMom) {
        return res.status(403).json({ message: 'Not authorized to view this wishlist' });
      }

      res.json({ wishlist: participant.wishlist });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put(
  '/:eventId/participants/:participantId/wishlist/:itemId',
  protect,
  [
    param('eventId').isMongoId().withMessage('Invalid event ID'),
    param('participantId').isMongoId().withMessage('Invalid participant ID'),
    param('itemId').isMongoId().withMessage('Invalid wishlist item ID'),
    body('name').optional().notEmpty().withMessage('Wishlist item name cannot be empty'),
    body('url').optional().isURL().withMessage('Invalid URL'),
    body('notes').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const Event = require('../models/Event');
      const event = await Event.findById(req.params.eventId);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const participant = event.participants.id(req.params.participantId);
      if (!participant) return res.status(404).json({ message: 'Participant not found' });

      const item = participant.wishlist.id(req.params.itemId);
      if (!item) return res.status(404).json({ message: 'Wishlist item not found' });

      if (req.body.name !== undefined) item.name = req.body.name;
      if (req.body.url !== undefined) item.url = req.body.url;
      if (req.body.notes !== undefined) item.notes = req.body.notes;

      await event.save();
      res.json({ wishlist: participant.wishlist });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Add wishlist item
router.post(
  '/:eventId/participants/:participantId/wishlist',
  protect,
  [
    param('eventId').isMongoId().withMessage('Invalid event ID'),
    param('participantId').isMongoId().withMessage('Invalid participant ID'),
    body('name').notEmpty().withMessage('Wishlist item name is required'),
    body('url').optional().isURL().withMessage('Invalid URL'),
    body('notes').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const Event = require('../models/Event');
      const event = await Event.findById(req.params.eventId);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const participant = event.participants.id(req.params.participantId);
      if (!participant) return res.status(404).json({ message: 'Participant not found' });

      // Authorization: Only the participant can add to their own wishlist
      if (!participant.user || !participant.user.equals(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to modify this wishlist' });
      }

      participant.wishlist.push({
        name: req.body.name,
        url: req.body.url,
        notes: req.body.notes
      });

      await event.save();
      res.status(201).json({ wishlist: participant.wishlist });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a wishlist item
router.delete(
  '/:eventId/participants/:participantId/wishlist/:itemId',
  protect,
  [
    param('eventId').isMongoId().withMessage('Invalid event ID'),
    param('participantId').isMongoId().withMessage('Invalid participant ID'),
    param('itemId').isMongoId().withMessage('Invalid wishlist item ID')
  ],
  validate,
  async (req, res) => {
    try {
      const Event = require('../models/Event');
      const event = await Event.findById(req.params.eventId);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const participant = event.participants.id(req.params.participantId);
      if (!participant) return res.status(404).json({ message: 'Participant not found' });

      const item = participant.wishlist.id(req.params.itemId);
      if (!item) return res.status(404).json({ message: 'Wishlist item not found' });

      item.remove();
      await event.save();

      res.json({ wishlist: participant.wishlist });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
