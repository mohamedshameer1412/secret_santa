const mongoose = require('mongoose');

// Embedded Participant Schema
const ParticipantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  wishlist: [
    {
      name: { type: String, required: true }, // e.g. "Bluetooth Headphones"
      url: { type: String },                  // e.g. Amazon/product link
      notes: { type: String }                 // e.g. "Preferably black color"
    }
  ],
  confirmed: {
    type: Boolean,
    default: false
  },
  giftFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or 'Participant' if needed
    default: null
  }
}, { _id: true }); // Keep _id for referencing participants

// Event Schema
const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [ParticipantSchema],
  budget: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  exchangeDate: {
    type: Date,
    required: true
  },
  drawingComplete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);
