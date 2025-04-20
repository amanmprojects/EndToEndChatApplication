"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const messageController_1 = __importDefault(require("../controllers/messageController"));
const router = express_1.default.Router();
const messageController = new messageController_1.default();
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// Direct Messaging Routes
// Get all conversations for the current user
router.get('/conversations', auth_1.authenticateJwt, asyncHandler(messageController.getUserConversations.bind(messageController)));
// Get or create a conversation with another user
router.get('/conversations/user/:receiverId', auth_1.authenticateJwt, asyncHandler(messageController.getOrCreateConversation.bind(messageController)));
// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', auth_1.authenticateJwt, asyncHandler(messageController.getConversationMessages.bind(messageController)));
// Mark all messages in a conversation as read
router.put('/conversations/:conversationId/read', auth_1.authenticateJwt, asyncHandler(messageController.markMessagesAsRead.bind(messageController)));
// Send a direct message
router.post('/direct', auth_1.authenticateJwt, asyncHandler(messageController.sendDirectMessage.bind(messageController)));
// Room Chat Routes
// Get messages for a specific room
router.get('/rooms/:roomId', auth_1.authenticateJwt, asyncHandler(messageController.getRoomMessages.bind(messageController)));
// Send a message to a room
router.post('/rooms', auth_1.authenticateJwt, asyncHandler(messageController.sendRoomMessage.bind(messageController)));
exports.default = router;
