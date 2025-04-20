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
const mongoose_1 = __importDefault(require("mongoose"));
const Message_1 = __importDefault(require("../models/Message"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
class MessageController {
    // Get all messages for a conversation
    getConversationMessages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { conversationId } = req.params;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid conversation ID'
                    });
                }
                // First check if the user is part of this conversation
                const conversation = yield Conversation_1.default.findOne({
                    _id: conversationId,
                    participants: userId
                });
                if (!conversation) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not a participant in this conversation'
                    });
                }
                // Get messages for the conversation
                const messages = yield Message_1.default.find({ conversationId })
                    .sort({ createdAt: 1 })
                    .populate('sender', 'username profilePic');
                return res.status(200).json({
                    success: true,
                    messages
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get messages',
                    error: error.message
                });
            }
        });
    }
    // Get all conversations for a user
    getUserConversations(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                // Get all conversations where the user is a participant
                const conversations = yield Conversation_1.default.find({
                    participants: userId
                })
                    .populate('participants', 'username email profilePic')
                    .populate('lastMessage')
                    .sort({ updatedAt: -1 });
                return res.status(200).json({
                    success: true,
                    conversations
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get conversations',
                    error: error.message
                });
            }
        });
    }
    // Create or get a conversation between two users
    getOrCreateConversation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { receiverId } = req.params;
                const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!senderId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                if (!mongoose_1.default.Types.ObjectId.isValid(receiverId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid receiver ID'
                    });
                }
                // Prevent creating a conversation with yourself
                if (senderId.toString() === receiverId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot create a conversation with yourself'
                    });
                }
                // Convert string IDs to ObjectIDs
                const participantIds = [
                    new mongoose_1.default.Types.ObjectId(senderId.toString()),
                    new mongoose_1.default.Types.ObjectId(receiverId)
                ];
                // Find or create a conversation
                const conversation = yield Conversation_1.default.findOneOrCreate(participantIds);
                // Populate participant data
                yield conversation.populate('participants', 'username email profilePic');
                // Populate last message if it exists
                if (conversation.lastMessage) {
                    yield conversation.populate('lastMessage');
                }
                return res.status(200).json({
                    success: true,
                    conversation
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get or create conversation',
                    error: error.message
                });
            }
        });
    }
    // Send a message in a conversation
    sendDirectMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const { conversationId, content } = req.body;
                const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!senderId) {
                    yield session.abortTransaction();
                    session.endSession();
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                if (!conversationId || !content) {
                    yield session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({
                        success: false,
                        message: 'Conversation ID and message content are required'
                    });
                }
                // Check if the conversation exists and the user is part of it
                const conversation = yield Conversation_1.default.findOne({
                    _id: conversationId,
                    participants: senderId
                }).session(session);
                if (!conversation) {
                    yield session.abortTransaction();
                    session.endSession();
                    return res.status(403).json({
                        success: false,
                        message: 'Conversation not found or you are not a participant'
                    });
                }
                // Create the new message
                const newMessage = new Message_1.default({
                    conversationId,
                    sender: senderId,
                    content,
                    read: false
                });
                yield newMessage.save({ session });
                // Update conversation with the new message - Fix the typing issues
                const typedConversation = conversation;
                // Use proper type casting for ObjectId
                typedConversation.lastMessage = newMessage._id;
                typedConversation.messages.push(newMessage._id);
                yield typedConversation.save({ session });
                yield session.commitTransaction();
                session.endSession();
                // Populate sender information for the response
                yield newMessage.populate('sender', 'username profilePic');
                return res.status(201).json({
                    success: true,
                    message: newMessage
                });
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send message',
                    error: error.message
                });
            }
        });
    }
    // Mark messages in a conversation as read
    markMessagesAsRead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { conversationId } = req.params;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                // Update all unread messages sent by others in this conversation
                const result = yield Message_1.default.updateMany({
                    conversationId,
                    sender: { $ne: userId },
                    read: false
                }, {
                    $set: { read: true }
                });
                return res.status(200).json({
                    success: true,
                    updatedCount: result.modifiedCount
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to mark messages as read',
                    error: error.message
                });
            }
        });
    }
    // Get messages for a room (group chat)
    getRoomMessages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { roomId } = req.params;
                // Get messages for the room
                const messages = yield Message_1.default.find({ roomId })
                    .sort({ createdAt: 1 })
                    .populate('sender', 'username profilePic');
                return res.status(200).json({
                    success: true,
                    messages
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get room messages',
                    error: error.message
                });
            }
        });
    }
    // Send a message to a room
    sendRoomMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { roomId, content } = req.body;
                const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!senderId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                if (!roomId || !content) {
                    return res.status(400).json({
                        success: false,
                        message: 'Room ID and message content are required'
                    });
                }
                // Create and save the new message
                const newMessage = new Message_1.default({
                    roomId,
                    sender: senderId,
                    content,
                    read: true // Room messages are always marked as read
                });
                yield newMessage.save();
                // Populate sender information for the response
                yield newMessage.populate('sender', 'username profilePic');
                return res.status(201).json({
                    success: true,
                    message: newMessage
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send room message',
                    error: error.message
                });
            }
        });
    }
}
exports.default = MessageController;
