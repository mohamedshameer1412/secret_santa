const mongoose = require('mongoose');

const clueSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  revealedAt: {
    type: Date,
    default: Date.now
  }
});

const childSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 5,
    max: 15
  },
  avatar: {
    type: String,
    default: 'https://i.pravatar.cc/150?img=1'
  },
  clues: [clueSchema],
  dare: {
    text: String,
    completed: {
      type: Boolean,
      default: false
    },
    proof: {
      type: String, // URL to image/video proof
      default: null
    },
    submittedAt: Date
  },
  revealedAt: {
    type: Date,
    default: Date.now
  },
  nextClueAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Child', childSchema);