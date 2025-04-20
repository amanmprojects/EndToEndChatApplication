import { create } from 'zustand';
import { Message, Room, Conversation, ChatType, ActiveChat, User } from '../types/chat';
import messageService from '../services/messageService';
import { searchUsers } from '../services/userService';

interface ChatState {
  activeChat: ActiveChat | null;
  messages: Message[];
  rooms: Room[];
  conversations: Conversation[];
  searchResults: User[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions for both chat types
  setActiveChat: (chat: ActiveChat) => void;
  clearActiveChat: () => void;
  addMessage: (message: Message) => void;
  clearError: () => void;
  
  // Room-based chat actions
  fetchRoomMessages: (roomId: string) => Promise<void>;
  sendRoomMessage: (content: string) => Promise<boolean>;
  
  // Direct messaging actions
  fetchConversations: () => Promise<void>;
  fetchConversationMessages: (conversationId: string) => Promise<void>;
  startConversation: (userId: string) => Promise<void>;
  sendDirectMessage: (content: string) => Promise<boolean>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  
  // User search actions
  searchUsers: (query: string) => Promise<void>;
  clearSearchResults: () => void;
}

const useChatStore = create<ChatState>((set, get) => ({
  activeChat: null,
  messages: [],
  rooms: [],
  conversations: [],
  searchResults: [],
  searchQuery: '',
  isLoading: false,
  error: null,
  
  // General actions
  setActiveChat: (chat) => {
    set({ activeChat: chat, error: null });
    
    if (chat.type === ChatType.ROOM) {
      get().fetchRoomMessages(chat.id);
      
      // Also join the room via Socket.io
      messageService.joinRoom(chat.id).catch(err => {
        set({ error: 'Failed to join chat room. Please try again.' });
      });
    } else {
      get().fetchConversationMessages(chat.id);
      get().markConversationAsRead(chat.id);
    }
  },
  
  clearActiveChat: () => {
    set({ activeChat: null, messages: [] });
  },
  
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
    
    // Update last message in the relevant conversation or room
    if (message.conversationId) {
      set(state => ({
        conversations: state.conversations.map(conv => 
          conv._id === message.conversationId 
            ? { ...conv, lastMessage: message }
            : conv
        )
      }));
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  // Room-based chat actions
  fetchRoomMessages: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await messageService.getMessages(roomId);
      set({ messages, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || 'Failed to fetch messages. Please try refreshing the page.'
      });
    }
  },
  
  sendRoomMessage: async (content) => {
    const { activeChat } = get();
    set({ error: null });
    
    if (!activeChat || activeChat.type !== ChatType.ROOM) {
      set({ error: 'No active chat room. Please join a room first.' });
      return false;
    }
    
    try {
      const success = await messageService.sendMessage(content, activeChat.id);
      
      if (!success) {
        set({ error: 'Failed to send message. Server may be experiencing issues.' });
      }
      
      return success;
    } catch (error: any) {
      set({ error: error.message || 'Failed to send message. Please try again.' });
      return false;
    }
  },
  
  // Direct messaging actions
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await messageService.getUserConversations();
      set({ conversations, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch conversations.' 
      });
    }
  },
  
  fetchConversationMessages: async (conversationId) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await messageService.getConversationMessages(conversationId);
      set({ messages, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch conversation messages.' 
      });
    }
  },
  
  startConversation: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const conversation = await messageService.getOrCreateConversation(userId);
      
      if (conversation) {
        // Add to conversations if not already there
        set(state => {
          const exists = state.conversations.some(c => c._id === conversation._id);
          return {
            conversations: exists 
              ? state.conversations 
              : [conversation, ...state.conversations],
            activeChat: {
              id: conversation._id,
              type: ChatType.DIRECT,
              recipient: conversation.participants.find(
                p => p._id !== userId
              )
            },
            isLoading: false
          };
        });
        
        // Fetch messages for the conversation
        get().fetchConversationMessages(conversation._id);
      } else {
        set({ 
          isLoading: false, 
          error: 'Failed to create conversation.' 
        });
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to start conversation.' 
      });
    }
  },
  
  sendDirectMessage: async (content) => {
    const { activeChat } = get();
    set({ error: null });
    
    if (!activeChat || activeChat.type !== ChatType.DIRECT) {
      set({ error: 'No active conversation. Please start a conversation first.' });
      return false;
    }
    
    try {
      const message = await messageService.sendDirectMessage(activeChat.id, content);
      
      if (message) {
        get().addMessage(message);
        return true;
      } else {
        set({ error: 'Failed to send message. Server may be experiencing issues.' });
        return false;
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to send message. Please try again.' });
      return false;
    }
  },
  
  markConversationAsRead: async (conversationId) => {
    try {
      await messageService.markMessagesAsRead(conversationId);
      
      // Update the read status in the conversations list
      set(state => ({
        conversations: state.conversations.map(conv => {
          if (conv._id === conversationId && conv.lastMessage) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                read: true
              }
            };
          }
          return conv;
        })
      }));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  },
  
  // User search actions
  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '' });
      return;
    }
    
    set({ isLoading: true, searchQuery: query });
    
    try {
      const users = await searchUsers(query);
      set({ searchResults: users, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || 'Failed to search users.',
        searchResults: []
      });
    }
  },
  
  clearSearchResults: () => {
    set({ searchResults: [], searchQuery: '' });
  }
}));

export default useChatStore;