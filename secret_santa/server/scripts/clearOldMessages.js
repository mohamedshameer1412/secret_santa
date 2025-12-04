const mongoose = require('mongoose');
const Message = require('../models/Message');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to MongoDB');
    
    // Delete all messages without tag field
    const result = await Message.deleteMany({ tag: { $exists: false } });
    console.log(`Deleted ${result.deletedCount} old messages without HMAC tags`);
    
    // Or to delete ALL messages for new start
    // const result = await Message.deleteMany({});
    // console.log(`Deleted all ${result.deletedCount} messages`);
    
    process.exit(0);
});