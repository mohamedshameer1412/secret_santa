const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const dareRoutes = require('./routes/dareRoutes');
const { createServer } = require('http');

const app = express();
const server = createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dare', dareRoutes);

// Socket.IO setup
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle chat messages
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    // Handle dare assignments
    socket.on('dare assignment', (dare) => {
        io.emit('dare assignment', dare);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});