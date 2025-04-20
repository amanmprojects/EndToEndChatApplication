import { Response } from 'express';
import mongoose, { Types } from 'mongoose';
import Message, { IMessage } from '../models/Message';
import Conversation, { IConversation } from '../models/Conversation';
import { AuthRequest } from '../middlewares/auth';
import { IUser } from '../models/User';

class MessageController {
  // Get all messages for a conversation
  async getConversationMessages(req: AuthRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = req.user?._id;

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid conversation ID'
        });
      }

      // First check if the user is part of this conversation
      const conversation = await Conversation.findOne({
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
      const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .populate('sender', 'username profilePic');

      return res.status(200).json({
        success: true,
        messages
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get messages',
        error: error.message
      });
    }
  }

  // Get all conversations for a user
  async getUserConversations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get all conversations where the user is a participant
      const conversations = await Conversation.find({
        participants: userId
      })
        .populate('participants', 'username email profilePic')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

      return res.status(200).json({
        success: true,
        conversations
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get conversations',
        error: error.message
      });
    }
  }

  // Create or get a conversation between two users
  async getOrCreateConversation(req: AuthRequest, res: Response) {
    try {
      const { receiverId } = req.params;
      const senderId = req.user?._id;

      if (!senderId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
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
        new mongoose.Types.ObjectId(senderId.toString()),
        new mongoose.Types.ObjectId(receiverId)
      ];

      // Find or create a conversation
      const conversation = await Conversation.findOneOrCreate(participantIds);

      // Populate participant data
      await conversation.populate('participants', 'username email profilePic');
      
      // Populate last message if it exists
      if (conversation.lastMessage) {
        await conversation.populate('lastMessage');
      }

      return res.status(200).json({
        success: true,
        conversation
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get or create conversation',
        error: error.message
      });
    }
  }

  // Send a message in a conversation
  async sendDirectMessage(req: AuthRequest, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { conversationId, content } = req.body;
      const senderId = req.user?._id;

      if (!senderId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!conversationId || !content) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Conversation ID and message content are required'
        });
      }

      // Check if the conversation exists and the user is part of it
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: senderId
      }).session(session);

      if (!conversation) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          success: false,
          message: 'Conversation not found or you are not a participant'
        });
      }

      // Create the new message
      const newMessage = new Message({
        conversationId,
        sender: senderId,
        content,
        read: false
      });

      await newMessage.save({ session });

      // Update conversation with the new message - Fix the typing issues
      const typedConversation = conversation as IConversation;
      // Use proper type casting for ObjectId
      typedConversation.lastMessage = newMessage._id as unknown as mongoose.Types.ObjectId;
      typedConversation.messages.push(newMessage._id as unknown as mongoose.Types.ObjectId);
      await typedConversation.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Populate sender information for the response
      await newMessage.populate('sender', 'username profilePic');

      return res.status(201).json({
        success: true,
        message: newMessage
      });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  }

  // Mark messages in a conversation as read
  async markMessagesAsRead(req: AuthRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Update all unread messages sent by others in this conversation
      const result = await Message.updateMany(
        { 
          conversationId,
          sender: { $ne: userId },
          read: false 
        },
        { 
          $set: { read: true } 
        }
      );

      return res.status(200).json({
        success: true,
        updatedCount: result.modifiedCount
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
        error: error.message
      });
    }
  }

  // Get messages for a room (group chat)
  async getRoomMessages(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params;
      
      // Get messages for the room
      const messages = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .populate('sender', 'username profilePic');

      return res.status(200).json({
        success: true,
        messages
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get room messages',
        error: error.message
      });
    }
  }

  // Send a message to a room
  async sendRoomMessage(req: AuthRequest, res: Response) {
    try {
      const { roomId, content } = req.body;
      const senderId = req.user?._id;

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
      const newMessage = new Message({
        roomId,
        sender: senderId,
        content,
        read: true // Room messages are always marked as read
      });

      await newMessage.save();

      // Populate sender information for the response
      await newMessage.populate('sender', 'username profilePic');

      return res.status(201).json({
        success: true,
        message: newMessage
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send room message',
        error: error.message
      });
    }
  }
}

export default MessageController;