const mongoose = require('mongoose');
const crypto = require('crypto');

// AES-256-CBC + HMAC-SHA256 (Encrypt-then-MAC)
const ALGORITHM = 'aes-256-cbc';
const HMAC_ALGORITHM = 'sha256';

// Get keys from environment (32 bytes for AES-256)
const SECRET_KEY = process.env.CHAT_SECRET_KEY 
    ? Buffer.from(process.env.CHAT_SECRET_KEY, 'hex')
    : Buffer.from('your-32-char-secret-key-here-12345'.padEnd(64, '0'), 'hex');

const HMAC_KEY = process.env.CHAT_HMAC_KEY
    ? Buffer.from(process.env.CHAT_HMAC_KEY, 'hex')
    : Buffer.from('your-32-char-hmac-key-here-123456'.padEnd(64, '0'), 'hex');

// Encrypt text, then add HMAC for integrity
function encryptText(text) {
    try {
        // Generate random IV (Initialization Vector)
        const iv = crypto.randomBytes(16);

        // Encrypt the message
        const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        //  Create HMAC of (IV + Encrypted Text) for integrity
        const hmac = crypto.createHmac(HMAC_ALGORITHM, HMAC_KEY);
        hmac.update(iv.toString('hex') + encrypted);
        const tag = hmac.digest('hex');

        return {
            encryptedText: encrypted,
            iv: iv.toString('hex'),
            tag  // HMAC tag for authentication
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt message');
    }
}

// Verify HMAC first, then decrypt
function decryptText(encryptedText, iv, tag) {
    try {
        if (!tag) {
            console.warn('WARNING: Message without HMAC tag detected. Please clear old messages from database.');
            throw new Error('Message authentication tag missing');
        }

        // Verify HMAC tag first (prevents tampering)
        const hmac = crypto.createHmac(HMAC_ALGORITHM, HMAC_KEY);
        hmac.update(iv + encryptedText);
        const expectedTag = hmac.digest('hex');

        // Constant-time comparison to prevent timing attacks
        if (!crypto.timingSafeEqual(Buffer.from(tag, 'hex'), Buffer.from(expectedTag, 'hex'))) {
            throw new Error('Message authentication failed - possible tampering');
        }

        // Decrypt only if HMAC is valid
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, 'hex'));
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error.message);
        throw error;  // Throw error so it can be caught by asyncHandler
    }
}

const MessageSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true,
        index: true  // Index for faster queries
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true  // Index for faster queries
    },
    encryptedText: {
        type: String,
        required: true
    },
    iv: {
        type: String,
        required: true
    },
    tag: {  // HMAC tag for message authentication
        type: String,
        required: true  // Keep required - clear old messages instead
    },
    // Reactions from users (anonymous names used)
    reactions: [{
        emoji: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        anonymousName: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    // File/image attachment (encrypted)
    attachment: {
        type: {
            encryptedFileId: String,    // Encrypted GridFS file ID
            encryptedFileName: String,   // Encrypted original filename
            ivFileId: String,           // IV for file ID encryption
            ivFileName: String,         // IV for filename encryption
            tagFileId: String,          // HMAC tag for file ID
            tagFileName: String,        // HMAC tag for filename
            fileType: String,           // 'image' or 'file'
            size: Number                // File size in bytes
        },
        default: null
    }, 
    // Edit history
    editHistory: [{
        encryptedText: String,
        iv: String,
        tag: String,
        editedAt: { type: Date, default: Date.now }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    // Delivery status
    status: {
        type: String,
        enum: ['sending', 'sent', 'delivered', 'failed'],
        default: 'sent'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true  // Index for sorting
    }
});

// Compound index for efficient room message queries
MessageSchema.index({ roomId: 1, createdAt: 1 });

// Static methods
MessageSchema.statics.encryptText = encryptText;
MessageSchema.statics.decryptText = decryptText;

module.exports = mongoose.model('Message', MessageSchema);