const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

roomSchema.statics.createRoom = async function(name) {
    const room = new this({ name });
    return await room.save();
};

roomSchema.statics.joinRoom = async function(roomId, userId) {
    return await this.findByIdAndUpdate(roomId, { $addToSet: { participants: userId } }, { new: true });
};

roomSchema.statics.getRoom = async function(roomId) {
    return await this.findById(roomId).populate('participants');
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;