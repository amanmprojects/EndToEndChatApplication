"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const messages_1 = __importDefault(require("./routes/messages"));
const users_1 = __importDefault(require("./routes/users"));
// Models
const User_1 = __importDefault(require("./models/User"));
const Conversation_1 = __importDefault(require("./models/Conversation"));
// Initialize environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Get the frontend URL without trailing slash
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const io = new socket_io_1.Server(server, {
    cors: {
        origin: frontendUrl,
        methods: ['GET', 'POST'],
        credentials: true
    }
});
// Middlewares
app.use((0, cors_1.default)({
    origin: frontendUrl,
    credentials: true
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/users', users_1.default);
// Health endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// Socket.IO middleware for authentication
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token not provided'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        const userDoc = yield User_1.default.findById(decoded.id);
        if (!userDoc) {
            return next(new Error('Authentication error: User not found'));
        }
        // Fix: Properly cast to Document & IUser type to access _id
        // Convert to plain object to avoid type issues with Mongoose document
        const user = userDoc.toObject();
        socket.data.userId = user._id.toString();
        socket.data.username = user.username;
        next();
    }
    catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
    }
}));
// Map to track user socket connections
const userSocketMap = new Map();
// Socket.IO connection
io.on('connection', (socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;
    console.log(`User connected: ${username} (${userId}), socket ID: ${socket.id}`);
    // Store the socket ID for this user
    if (userId) {
        userSocketMap.set(userId, socket.id);
    }
    // Join a public chat room
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${username} joined room: ${roomId}`);
    });
    // Join a private conversation room
    socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${username} joined conversation: ${conversationId}`);
    });
    // Handle sending messages (both room and direct)
    socket.on('send_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (data.roomId) {
                // Room message - broadcast to everyone in the room
                socket.to(data.roomId).emit('receive_message', data);
            }
            else if (data.conversationId) {
                // Direct message - emit to the conversation room and to the specific recipient
                socket.to(`conversation:${data.conversationId}`).emit('receive_message', data);
                // Find the conversation to get the other participant
                const conversation = yield Conversation_1.default.findById(data.conversationId);
                if (conversation) {
                    // Find the recipient (the other participant who is not the sender)
                    const recipientId = conversation.participants
                        .map(p => p.toString())
                        .find(id => id !== userId);
                    if (recipientId) {
                        // Get the recipient's socket ID
                        const recipientSocketId = userSocketMap.get(recipientId);
                        // If the recipient is online but not in the conversation room
                        if (recipientSocketId) {
                            io.to(recipientSocketId).emit('receive_message', data);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
        }
    }));
    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${username}`);
        // Remove user from the socket map
        if (userId) {
            userSocketMap.delete(userId);
        }
    });
});
// Connect to MongoDB
mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);
const BACKUP_PORTS = [5001, 5002, 5003, 5004];
function startServer(port) {
    server.listen(port)
        .on('listening', () => {
        console.log(`Server running on port ${port}`);
    })
        .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            if (BACKUP_PORTS.length > 0) {
                const nextPort = BACKUP_PORTS.shift();
                console.log(`Port ${port} is in use, trying port ${nextPort}`);
                startServer(nextPort);
            }
            else {
                console.error('All ports are in use. Please close other applications or specify a different port.');
                process.exit(1);
            }
        }
        else {
            console.error('Error starting server:', err);
            process.exit(1);
        }
    });
}
startServer(PORT);
