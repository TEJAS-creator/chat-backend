const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();

// Enable CORS for all origins so your Vercel deployment can connect
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

// Simple health check endpoint for deployment platforms
app.get('/', (req, res) => {
    res.send('WebSocket Relay Server is Online.');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Server memory mapping for scalability
const rooms = new Map();

wss.on('connection', (ws) => {
    let currentRoomCode = null;
    let currentUserId = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'join_or_restore': {
                    const { roomCode, username, isHost, userId } = data;
                    currentRoomCode = roomCode;
                    currentUserId = userId;

                    if (!rooms.has(roomCode)) {
                        rooms.set(roomCode, {
                            hostId: isHost ? userId : null,
                            history: [],
                            activeUsers: new Map()
                        });
                    }

                    const room = rooms.get(roomCode);

                    if (isHost && !room.hostId) {
                        room.hostId = userId;
                    }

                    room.activeUsers.set(userId, ws);

                    ws.send(JSON.stringify({ 
                        type: 'history', 
                        data: room.history,
                        isHostUser: room.hostId === userId 
                    }));

                    broadcastToRoom(roomCode, {
                        type: 'system',
                        message: `${username} enters the room.`
                    });
                    break;
                }

                case 'chat':
                case 'image': {
                    if (currentRoomCode && rooms.has(currentRoomCode)) {
                        const room = rooms.get(currentRoomCode);
                        const msgPayload = {
                            type: data.type,
                            user: data.username,
                            content: data.content,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };

                        room.history.push(msgPayload);
                        broadcastToRoom(currentRoomCode, msgPayload);
                    }
                    break;
                }

                case 'leave_room': {
                    if (currentRoomCode && rooms.has(currentRoomCode)) {
                        const room = rooms.get(currentRoomCode);
                        room.activeUsers.delete(currentUserId);
                        
                        broadcastToRoom(currentRoomCode, {
                            type: 'system',
                            message: `${data.username} has left the channel.`
                        });
                    }
                    break;
                }

                case 'stop_room': {
                    if (currentRoomCode && rooms.has(currentRoomCode)) {
                        const room = rooms.get(currentRoomCode);
                        if (room.hostId === currentUserId) {
                            broadcastToRoom(currentRoomCode, {
                                type: 'room_destroyed',
                                message: 'The host has terminated this server room instance. Wiping history...'
                            });

                            room.activeUsers.forEach((socket) => {
                                if (socket.readyState === WebSocket.OPEN) socket.close();
                            });
                            rooms.delete(currentRoomCode);
                        }
                    }
                    break;
                }
            }
        } catch (err) {
            console.error("Error processing incoming WS data frame:", err);
        }
    });

    ws.on('close', () => {
        if (currentRoomCode && rooms.has(currentRoomCode)) {
            const room = rooms.get(currentRoomCode);
            room.activeUsers.delete(currentUserId);
        }
    });
});

function broadcastToRoom(roomCode, payload) {
    const room = rooms.get(roomCode);
    if (room) {
        room.activeUsers.forEach((clientSocket) => {
            if (clientSocket.readyState === WebSocket.OPEN) {
                clientSocket.send(JSON.stringify(payload));
            }
        });
    }
}

// Global port handling
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));