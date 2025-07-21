const mongoose = require('mongoose');

const dareSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  clues: [{
    type: String,
    required: true
  }],
  assignedTo: {
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