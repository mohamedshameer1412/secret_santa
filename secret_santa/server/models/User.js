const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load avatar metadata from downloaded files (Use node server/generateAvatars.js to create)
let availableAvatars = [];

try {
  const avatarsPath = path.join(__dirname, '../../public/avatars/avatars.json');
  if (fs.existsSync(avatarsPath)) {
    availableAvatars = JSON.parse(fs.readFileSync(avatarsPath, 'utf8'));
    console.log(`✅ Loaded ${availableAvatars.length} avatars from local files`);
  } else {
    console.warn('⚠️  Avatar files not found. Run: node server/scripts/downloadAvatars.js');
  }
} catch (error) {
  console.error('❌ Error loading avatars:', error.message);
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  profilePic: {
    type: String,
    default: function () {
      // ✅ Only use local avatars, no API fallback
      if (availableAvatars.length > 0) {
        const randomAvatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
        return randomAvatar.path;
      }
      // ✅ Empty string - frontend handles placeholder
      return '';
    }
  },
  avatarStyle: {
    type: String,
    default: 'shapes'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ Static methods for avatar management
userSchema.statics.getAvailableAvatars = function() {
  return availableAvatars;
};

userSchema.statics.getAvatarsByStyle = function(style) {
  return availableAvatars.filter(avatar => avatar.style === style);
};

userSchema.statics.getRandomAvatar = function(excludeCurrent = null) {
  let filtered = availableAvatars;
  if (excludeCurrent && filtered.length > 1) {
    filtered = availableAvatars.filter(a => a.path !== excludeCurrent);
  }
  return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : null;
};

const User = mongoose.model('User', userSchema);

module.exports = User;