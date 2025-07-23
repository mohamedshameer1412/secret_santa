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

module.exports = router;
