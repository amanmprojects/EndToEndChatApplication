import api from './api';
import { Message, Conversation } from '../types/chat';

interface MessageResponse {
  success: boolean;
  messages?: Message[];
  message?: Message | string;
}

interface ConversationResponse {
  success: boolean;
  conversation: Conversation;
}

interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

interface SendMessageResponse {
  success: boolean;
  message?: Message | string;
}

const messageService = {
  // Room-based chat functions
  getMessages: async (roomId: string): Promise<Message[]> => {
    try {
      const response = await api.get<MessageResponse>(`/api/messages/rooms/${roomId}`);
      return response.data.messages || [];
    } catch (error: any) {
      console.error('Failed to get messages:', error);
      
      // Don't show multiple auth errors if we're already redirecting
      if (error.response?.status === 401) {
        // Let the API interceptor handle the auth error
        // This prevents duplicate error handling
        return [];
      }
      
      if (error.response?.status === 500) {
        console.error('Server error when fetching messages. The server might be down or experiencing issues.');
      }
      
      // Return empty array on error to avoid UI breaking
      return [];
    }
  },

  sendMessage: async (content: string, roomId: string): Promise<boolean> => {
    try {
      const response = await api.post<SendMessageResponse>('/api/messages/rooms', { content, roomId });
      return response.data.success;
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Log detailed error information
      if (error.response) {
        // The server responded with an error status
        console.error(`Send message failed with status ${error.response.status}:`, error.response.data);
        
        if (error.response.status === 401) {
          // Let the API interceptor handle the auth error
          console.error('Authentication required to send messages');
        } else if (error.response.status === 500) {
          // You could also display a toast notification or other UI feedback here
          console.error('Internal server error. The message was not sent. Please try again later.');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Network error - no response received when sending message');
      }
      
      return false;
    }
  },
  
  // This method could be used in the future for joining rooms if needed
  joinRoom: async (roomId: string): Promise<boolean> => {
    try {
      // If your backend requires an API call to join a room (beyond Socket.io)
      // You can implement that here
      return true;
    } catch (error: any) {
      console.error('Failed to join room:', error);
      
      // Log additional details about the error
      if (error.response) {
        console.error(`Join room failed with status ${error.response.status}:`, error.response.data);
      }
      
      return false;
    }
  },

  // Direct messaging functions
  getUserConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await api.get<ConversationsResponse>('/api/messages/conversations');
      return response.data.conversations || [];
    } catch (error: any) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  },

  getOrCreateConversation: async (userId: string): Promise<Conversation | null> => {
    try {
      const response = await api.get<ConversationResponse>(`/api/messages/conversations/user/${userId}`);
      return response.data.conversation;
    } catch (error: any) {
      console.error('Failed to get or create conversation:', error);
      return null;
    }
  },

  getConversationMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      const response = await api.get<MessageResponse>(`/api/messages/conversations/${conversationId}/messages`);
      return response.data.messages || [];
    } catch (error: any) {
      console.error('Failed to get conversation messages:', error);
      return [];
    }
  },

  sendDirectMessage: async (conversationId: string, content: string): Promise<Message | null> => {
    try {
      const response = await api.post<SendMessageResponse>('/api/messages/direct', { 
        conversationId, 
        content 
      });
      return response.data.message as Message || null;
    } catch (error: any) {
      console.error('Failed to send direct message:', error);
      return null;
    }
  },

  markMessagesAsRead: async (conversationId: string): Promise<boolean> => {
    try {
      await api.put(`/api/messages/conversations/${conversationId}/read`);
      return true;
    } catch (error: any) {
      console.error('Failed to mark messages as read:', error);
      return false;
    }
  }
};

export default messageService;