const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  // Basic room info (used by both chat and Secret Santa)
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Chat features
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  ],
  anonymousMode: {
    type: Boolean,
    default: true  // Default to anonymous for privacy
  },
  anonymousNames: {
    type: Map,
    of: String,
    default: new Map()
  },
  allowChat: {
    type: Boolean,
    default: true
  },
  
  // Secret Santa features (optional - only used when room is a Secret Santa event)
  roomType: {
    type: String,
    enum: ['chat', 'secret-santa'],
    default: 'chat'
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values, but unique non-null values
  },
  allowAnyoneInvite: {
    type: Boolean,
    default: false  // Default: only organizer can generate invite links
  },
  maxParticipants: {
    type: Number,
    default: 20,
    min: 2
  },
  drawDate: {
    type: Date
  },
  giftBudget: {
    type: Number,
    default: 50
  },
  allowWishlist: {
    type: Boolean,
    default: true
  },
  autoRollEnabled: {
    type: Boolean,
    default: false  // Default: organizer manually assigns pairs
  },
  theme: {
    type: String,
    enum: ['christmas', 'winter', 'festive', 'elegant'],
    default: 'christmas'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'drawn', 'completed'],
    default: 'waiting'
  },
  pairings: [{
    giver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
});

// Update timestamp on save
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static: Create a new room (works for both chat and Secret Santa)
roomSchema.statics.createRoom = async function (roomData, organizerId) {
  const room = new this({
    ...roomData,
    organizer: organizerId,
    participants: [organizerId]
  });
  return await room.save();
};

// Static: Add a user to a room
roomSchema.statics.joinRoom = async function (roomId, userId) {
  const room = await this.findById(roomId);
  
  if (!room) {
    throw new Error('Room not found');
  }
  
  if (room.participants.includes(userId)) {
    throw new Error('User already in room');
  }
  
  if (room.maxParticipants && room.participants.length >= room.maxParticipants) {
    throw new Error('Room is full');
  }
  
  room.participants.push(userId);
  return await room.save();
};

// Static: Add participant to room (alias for backward compatibility)
roomSchema.statics.addParticipant = async function(roomId, userId) {
  return await this.joinRoom(roomId, userId);
};

// Static: Get a room by ID with participants
roomSchema.statics.getRoom = async function (roomId) {
  return await this.findById(roomId).populate('participants');
};

// Static: Get room with populated data (for Secret Santa)
roomSchema.statics.getRoomWithDetails = async function(roomId) {
  return await this.findById(roomId)
    .populate('organizer', 'username email profilePic')
    .populate('participants', 'username email profilePic');
};

const ChatRoom = mongoose.model('ChatRoom', roomSchema);

module.exports = ChatRoom;