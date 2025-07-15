const mongoose = require('mongoose');
const crypto = require('crypto');

// AES encryption settings
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.CHAT_SECRET_KEY || 'your-32-char-secret-key-here'; // Use env variable in production

// Helper: Encrypt text
function encryptText(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encryptedText: encrypted, iv: iv.toString('hex') };
}

// Helper: Decrypt text
function decryptText(encryptedText, iv) {
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const MessageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  encryptedText: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

// Static methods for encryption/decryption
MessageSchema.statics.encryptText = encryptText;
MessageSchema.statics.decryptText = decryptText;

module.exports = mongoose.model('Message', MessageSchema);