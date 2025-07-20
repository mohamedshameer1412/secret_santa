const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    chatHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }]
});

userSchema.methods.addToChatHistory = function(messageId) {
    this.chatHistory.push(messageId);
    return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;