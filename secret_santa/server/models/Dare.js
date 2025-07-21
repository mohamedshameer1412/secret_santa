const mongoose = require('mongoose');

const dareSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  assignedUser: {  // Changed from assignedTo to match controller
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  clues: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Dare = mongoose.model('Dare', dareSchema);

module.exports = Dare;
