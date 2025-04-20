import express from 'express';
import { AuthRequest, authenticateJwt } from '../middlewares/auth';
import MessageController from '../controllers/messageController';

const router = express.Router();
const messageController = new MessageController();

function asyncHandler(fn: any) {
  return function (req: express.Request, res: express.Response, next: express.NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Direct Messaging Routes
// Get all conversations for the current user
router.get('/conversations', authenticateJwt, asyncHandler(messageController.getUserConversations.bind(messageController)));

// Get or create a conversation with another user
router.get('/conversations/user/:receiverId', authenticateJwt, asyncHandler(messageController.getOrCreateConversation.bind(messageController)));

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', authenticateJwt, asyncHandler(messageController.getConversationMessages.bind(messageController)));

// Mark all messages in a conversation as read
router.put('/conversations/:conversationId/read', authenticateJwt, asyncHandler(messageController.markMessagesAsRead.bind(messageController)));

// Send a direct message
router.post('/direct', authenticateJwt, asyncHandler(messageController.sendDirectMessage.bind(messageController)));

// Room Chat Routes
// Get messages for a specific room
router.get('/rooms/:roomId', authenticateJwt, asyncHandler(messageController.getRoomMessages.bind(messageController)));

// Send a message to a room
router.post('/rooms', authenticateJwt, asyncHandler(messageController.sendRoomMessage.bind(messageController)));

export default router;