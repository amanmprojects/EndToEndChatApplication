import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Routes
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import userRoutes from './routes/users';

// Middlewares
import { authenticateJwt } from './middlewares/auth';

// Models
import User, { IUser } from './models/User';
import Conversation from './models/Conversation';

// Initialize environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Get the frontend URL without trailing slash
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middlewares
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as jwt.JwtPayload;
    const userDoc = await User.findById(decoded.id);
    
    if (!userDoc) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Fix: Properly cast to Document & IUser type to access _id
    // Convert to plain object to avoid type issues with Mongoose document
    const user = userDoc.toObject() as IUser & { _id: mongoose.Types.ObjectId };
    socket.data.userId = user._id.toString();
    socket.data.username = user.username;
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

// Map to track user socket connections
const userSocketMap = new Map<string, string>();

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
  socket.on('send_message', async (data) => {
    try {
      if (data.roomId) {
        // Room message - broadcast to everyone in the room
        socket.to(data.roomId).emit('receive_message', data);
      } 
      else if (data.conversationId) {
        // Direct message - emit to the conversation room and to the specific recipient
        socket.to(`conversation:${data.conversationId}`).emit('receive_message', data);
        
        // Find the conversation to get the other participant
        const conversation = await Conversation.findById(data.conversationId);
        
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
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

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
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);
const BACKUP_PORTS = [5001, 5002, 5003, 5004];

function startServer(port: number) {
  server.listen(port)
    .on('listening', () => {
      console.log(`Server running on port ${port}`);
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        if (BACKUP_PORTS.length > 0) {
          const nextPort = BACKUP_PORTS.shift();
          console.log(`Port ${port} is in use, trying port ${nextPort}`);
          startServer(nextPort!);
        } else {
          console.error('All ports are in use. Please close other applications or specify a different port.');
          process.exit(1);
        }
      } else {
        console.error('Error starting server:', err);
        process.exit(1);
      }
    });
}

startServer(PORT);