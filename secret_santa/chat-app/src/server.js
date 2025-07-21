const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

// Connect to the database
db.connect();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server);

// Set up Socket.IO events
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  // Additional Socket.IO event handlers can be added here
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});