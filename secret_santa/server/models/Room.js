const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  inviteCode: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values, but unique non-null values
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
  isPrivate: {
    type: Boolean,
    default: false
  },
  allowWishlist: {
    type: Boolean,
    default: true
  },
  allowChat: {
    type: Boolean,
    default: true
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
  }],
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom' // Link to existing ChatRoom model
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static: Create a new Secret Santa room
roomSchema.statics.createRoom = async function(roomData, adminId) {
  const room = new this({
    ...roomData,
    admin: adminId,
    participants: [adminId]
  });
  return await room.save();
};

// Static: Add participant to room
roomSchema.statics.addParticipant = async function(roomId, userId) {
  const room = await this.findById(roomId);
  
  if (!room) {
    throw new Error('Room not found');
  }
  
  if (room.participants.includes(userId)) {
    throw new Error('User already in room');
  }
  
  if (room.participants.length >= room.maxParticipants) {
    throw new Error('Room is full');
  }
  
  room.participants.push(userId);
  return await room.save();
};

// Static: Get room with populated data
roomSchema.statics.getRoomWithDetails = async function(roomId) {
  return await this.findById(roomId)
    .populate('admin', 'username email profilePic')
    .populate('participants', 'username email profilePic')
    .populate('chatRoom');
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;