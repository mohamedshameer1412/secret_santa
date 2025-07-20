const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = {};
const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        users[socket.id] = { username, room };
        rooms[room] = rooms[room] || [];
        rooms[room].push(username);

        socket.to(room).emit('message', `${username} has joined the room`);
    });

    socket.on('chatMessage', (msg) => {
        const user = users[socket.id];
        io.to(user.room).emit('message', { user: user.username, text: msg });
    });

    socket.on('dareAssignment', (dare) => {
        const user = users[socket.id];
        io.to(user.room).emit('dare', { user: user.username, dare });
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            const index = rooms[user.room].indexOf(user.username);
            if (index !== -1) {
                rooms[user.room].splice(index, 1);
            }
            socket.to(user.room).emit('message', `${user.username} has left the room`);
        }
        delete users[socket.id];
    });
});

module.exports = { server, io };