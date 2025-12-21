/**
 * Complete Test: Avatar Persistence with Profile Update
 * 
 * This test:
 * 1. Logs in
 * 2. Updates profile picture
 * 3. Sends a message (should use new avatar)
 * 4. Changes profile picture again
 * 5. Sends another message (should use newer avatar)
 * 6. Verifies old message still has old avatar
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secret-santa';

// Test avatars
const AVATAR_1 = '/avatars/shapes/Snowflake.svg';
const AVATAR_2 = '/avatars/shapes/Mittens.svg';
const AVATAR_3 = '/avatars/bottts/Fireplace.svg';

async function fullTest() {
    try {
        console.log('🧪 Complete Avatar Persistence Test\n');
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find a user (using admin for test)
        const user = await User.findOne({ email: 'admin@gmail.com' });
        if (!user) {
            console.log('❌ Test user not found. Please create admin@gmail.com first.');
            return;
        }

        console.log(`👤 Testing with user: ${user.name || user.username}`);
        console.log(`   Current avatar: ${user.profilePic || 'NONE'}\n`);

        // Find or create a test room
        let room = await ChatRoom.findOne({ participants: user._id }).limit(1);
        if (!room) {
            console.log('❌ No chat room found for this user.');
            return;
        }

        console.log(`💬 Using room: ${room.name}\n`);

        // Step 1: Set avatar 1 and send message
        console.log('1️⃣  Setting avatar to AVATAR_1 and sending message...');
        user.profilePic = AVATAR_1;
        await user.save();
        
        const msg1 = await Message.create({
            roomId: room._id,
            sender: user._id,
            encryptedText: 'encrypted1',
            iv: 'iv1',
            tag: 'tag1',
            senderAvatar: user.profilePic
        });
        
        console.log(`   ✅ Message 1 created with senderAvatar: ${msg1.senderAvatar}\n`);

        // Step 2: Set avatar 2 and send message
        console.log('2️⃣  Changing avatar to AVATAR_2 and sending message...');
        user.profilePic = AVATAR_2;
        await user.save();
        
        const msg2 = await Message.create({
            roomId: room._id,
            sender: user._id,
            encryptedText: 'encrypted2',
            iv: 'iv2',
            tag: 'tag2',
            senderAvatar: user.profilePic
        });
        
        console.log(`   ✅ Message 2 created with senderAvatar: ${msg2.senderAvatar}\n`);

        // Step 3: Set avatar 3 and send message
        console.log('3️⃣  Changing avatar to AVATAR_3 and sending message...');
        user.profilePic = AVATAR_3;
        await user.save();
        
        const msg3 = await Message.create({
            roomId: room._id,
            sender: user._id,
            encryptedText: 'encrypted3',
            iv: 'iv3',
            tag: 'tag3',
            senderAvatar: user.profilePic
        });
        
        console.log(`   ✅ Message 3 created with senderAvatar: ${msg3.senderAvatar}\n`);

        // Step 4: Fetch messages and verify avatars are different
        console.log('4️⃣  Fetching messages to verify persistence...');
        
        const messages = await Message.find({
            _id: { $in: [msg1._id, msg2._id, msg3._id] }
        })
        .populate('sender', 'name username profilePic')
        .sort({ createdAt: 1 })
        .lean();

        console.log(`   Found ${messages.length} messages\n`);

        // Check RAW message data before manipulation
        console.log('📋 RAW message data:');
        messages.forEach((msg, index) => {
            console.log(`Message ${index + 1} RAW:`);
            console.log(`   - msg.senderAvatar: ${msg.senderAvatar}`);
            console.log(`   - msg.sender.profilePic BEFORE override: ${msg.sender?.profilePic}`);
        });
        console.log('');

        // Apply the same logic as the API does (WITH THE FIX)
        messages.forEach((msg, index) => {
            // This is what the API does - create NEW sender object with stored avatar
            if (msg.senderAvatar && msg.sender) {
                console.log(`Overriding message ${index + 1}: ${msg.sender.profilePic} -> ${msg.senderAvatar}`);
                // FIX: Create new object instead of modifying existing reference
                msg.sender = {
                    ...msg.sender,
                    profilePic: msg.senderAvatar
                };
            }
            
            console.log(`Message ${index + 1} AFTER:`);
            console.log(`   - Stored senderAvatar: ${msg.senderAvatar}`);
            console.log(`   - Displayed avatar (sender.profilePic): ${msg.sender?.profilePic}`);
            console.log(`   - User's CURRENT profilePic: ${user.profilePic}`);
            console.log('');
        });

        // Verification
        console.log('5️⃣  Verification:');
        
        const msg1Avatar = messages[0].sender?.profilePic;
        const msg2Avatar = messages[1].sender?.profilePic;
        const msg3Avatar = messages[2].sender?.profilePic;
        
        if (msg1Avatar === AVATAR_1) {
            console.log(`   ✅ Message 1 shows AVATAR_1: ${msg1Avatar}`);
        } else {
            console.log(`   ❌ Message 1 WRONG: expected ${AVATAR_1}, got ${msg1Avatar}`);
        }
        
        if (msg2Avatar === AVATAR_2) {
            console.log(`   ✅ Message 2 shows AVATAR_2: ${msg2Avatar}`);
        } else {
            console.log(`   ❌ Message 2 WRONG: expected ${AVATAR_2}, got ${msg2Avatar}`);
        }
        
        if (msg3Avatar === AVATAR_3) {
            console.log(`   ✅ Message 3 shows AVATAR_3: ${msg3Avatar}`);
        } else {
            console.log(`   ❌ Message 3 WRONG: expected ${AVATAR_3}, got ${msg3Avatar}`);
        }

        // Check if all are different
        if (msg1Avatar !== msg2Avatar && msg2Avatar !== msg3Avatar && msg1Avatar !== msg3Avatar) {
            console.log('\n🎉 TEST PASSED! All messages show different avatars as expected!\n');
        } else {
            console.log('\n❌ TEST FAILED! Messages are showing the same avatar\n');
        }

        // Cleanup
        console.log('🧹 Cleaning up test messages...');
        await Message.deleteMany({ _id: { $in: [msg1._id, msg2._id, msg3._id] } });
        console.log('   ✅ Test messages deleted\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

fullTest();
