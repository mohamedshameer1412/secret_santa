/**
 * Quick Test: Verify Avatar Persistence
 * 
 * This script tests that new messages use the sender's current avatar
 * and that the avatar is properly stored and retrieved.
 * 
 * Run this after starting the server to verify the fix works.
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAvatarPersistence() {
    console.log('🧪 Testing Avatar Persistence Fix\n');
    
    try {
        // Step 1: Login to get a token
        console.log('1️⃣  Logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@gmail.com',  // Update with your test credentials
            password: 'pass123'
        });
        
        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log(`   ✅ Logged in as: ${user.username || user.name}`);
        console.log(`   📸 Current avatar: ${user.profilePic || 'default'}\n`);
        
        // Step 2: Get user's rooms
        console.log('2️⃣  Fetching chat rooms...');
        const roomsResponse = await axios.get(`${API_URL}/chat/my-rooms`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!roomsResponse.data.rooms || roomsResponse.data.rooms.length === 0) {
            console.log('   ⚠️  No rooms found. Please create a room first.');
            return;
        }
        
        const roomId = roomsResponse.data.rooms[0]._id;
        console.log(`   ✅ Using room: ${roomsResponse.data.rooms[0].name}\n`);
        
        // Step 3: Send a test message
        console.log('3️⃣  Sending test message...');
        const messageText = `Test message at ${new Date().toLocaleTimeString()} - Avatar persistence test`;
        const sendResponse = await axios.post(
            `${API_URL}/chat/${roomId}/message`,
            { text: messageText },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const sentMessage = sendResponse.data.message;
        console.log(`   ✅ Message sent with ID: ${sentMessage._id}`);
        console.log(`   📸 Stored avatar: ${sentMessage.senderAvatar || 'MISSING!'}`);
        console.log(`   👤 Display name: ${sentMessage.anonymousName || sentMessage.sender?.name || 'Unknown'}\n`);
        
        // Step 4: Fetch messages to verify
        console.log('4️⃣  Fetching messages to verify...');
        const messagesResponse = await axios.get(
            `${API_URL}/chat/${roomId}/messages`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const messages = messagesResponse.data.messages;
        const latestMessage = messages[messages.length - 1];
        
        console.log(`   ✅ Latest message avatar: ${latestMessage.sender?.profilePic || 'MISSING!'}`);
        console.log(`   📝 Message text: ${latestMessage.text}\n`);
        
        // Step 5: Verify results
        console.log('5️⃣  Verification Results:');
        if (sentMessage.senderAvatar) {
            console.log('   ✅ senderAvatar field is stored');
        } else {
            console.log('   ❌ senderAvatar field is MISSING');
        }
        
        if (latestMessage.sender?.profilePic) {
            console.log('   ✅ Avatar is returned when fetching messages');
        } else {
            console.log('   ❌ Avatar is NOT returned when fetching');
        }
        
        if (sentMessage.senderAvatar === latestMessage.sender?.profilePic) {
            console.log('   ✅ Stored avatar matches retrieved avatar');
            console.log('\n🎉 TEST PASSED! Avatar persistence is working correctly!\n');
        } else {
            console.log('   ⚠️  Avatar mismatch:');
            console.log(`      Stored: ${sentMessage.senderAvatar}`);
            console.log(`      Retrieved: ${latestMessage.sender?.profilePic}`);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log('\n💡 Tip: Update the login credentials in this script');
        }
    }
}

// Run test
testAvatarPersistence();
