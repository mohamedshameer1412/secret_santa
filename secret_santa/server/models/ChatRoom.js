const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  anonymousMode: {
    type: Boolean,
    default: false
    },
  anonymousNames: {
    type: Map,
    of: String,
    default: new Map()
    },
    organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    }
});

// Static: Create a new room
roomSchema.statics.createRoom = async function (name, organizerId) {
  const room = new this({
    name,
    organizer: organizerId,
    participants: [organizerId]
  });
  return await room.save();
};

// Static: Add a user to a room
roomSchema.statics.joinRoom = async function (roomId, userId) {
  return await this.findByIdAndUpdate(
    roomId,
    { $addToSet: { participants: userId } },
    { new: true }
  );
};

// Static: Get a room by ID with participants
roomSchema.statics.getRoom = async function (roomId) {
  return await this.findById(roomId).populate('participants');
};

const ChatRoom = mongoose.model('ChatRoom', roomSchema); // ✅ Renamed for consistency

module.exports = ChatRoom;
