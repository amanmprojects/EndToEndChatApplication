import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import { io, Socket } from 'socket.io-client';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import ConversationList from '../components/chat/ConversationList';
import { API_URL } from '../services/api';
import { useToast } from '../components/ui/ToastContext';
import { ActiveChat, ChatType } from '../types/chat';

// Extract the base URL without the '/api' part
const SOCKET_URL = API_URL.replace('/api', '');

const ChatPage = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { 
    messages, 
    activeChat,
    conversations,
    addMessage, 
    isLoading, 
    sendRoomMessage,
    sendDirectMessage,
    setActiveChat,
    fetchConversations,
    error
  } = useChatStore();
  const navigate = useNavigate();
  const messageListRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'chat' | 'conversations'>('chat');

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Show error toast if there's an error in chat store
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  // Fetch conversations
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // Connect to Socket.io server
  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to the backend socket server
      socketRef.current = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to Socket.io server');
      });

      socketRef.current.on('receive_message', (message) => {
        // Only add messages if they're not from this user
        if (message.userId !== user._id) {
          addMessage(message);
          
          // If this is a direct message for us and we're not in that conversation,
          // we need to update the conversation list to show the new message status
          if (message.conversationId && (!activeChat || activeChat.id !== message.conversationId)) {
            fetchConversations();
          }
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        showToast('Failed to connect to chat server. Please try again later.', 'error');
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isAuthenticated, user, addMessage, activeChat, fetchConversations, showToast]);

  // Join the active room or conversation when it changes
  useEffect(() => {
    if (socketRef.current && activeChat) {
      if (activeChat.type === ChatType.ROOM) {
        socketRef.current.emit('join_room', activeChat.id);
      } else {
        // For conversations, we might want to join a private room for real-time updates
        socketRef.current.emit('join_conversation', activeChat.id);
      }
    }
  }, [activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Set initial room if none is active
  useEffect(() => {
    // For now, we're using a default room. In a real app, you'd fetch rooms from the server
    if (!activeChat) {
      setActiveChat({
        id: 'default-room',
        type: ChatType.ROOM,
        name: 'General Chat'
      });
    }
  }, [activeChat, setActiveChat]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !activeChat) return;
    
    try {
      // Create a message object
      const message = {
        id: Date.now().toString(),
        text: messageText,
        content: messageText,
        roomId: activeChat.type === ChatType.ROOM ? activeChat.id : undefined,
        conversationId: activeChat.type === ChatType.DIRECT ? activeChat.id : undefined,
        sender: user?._id || 'unknown',
        userId: user?._id
      };
      
      let success = false;
      
      // Send to backend based on chat type
      if (activeChat.type === ChatType.ROOM) {
        success = await sendRoomMessage(messageText);
      } else {
        // Add to local state immediately for better UX
        addMessage(message);
        // Direct messages are handled differently - sendDirectMessage already adds to the local state
        const sentMessage = await sendDirectMessage(messageText);
        success = !!sentMessage;
      }
      
      if (!success) {
        showToast('Failed to send message. It may not be delivered.', 'error');
        return;
      }
      
      // Emit to Socket.io
      if (socketRef.current) {
        socketRef.current.emit('send_message', message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Something went wrong while sending your message.', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSelectConversation = (chat: ActiveChat) => {
    setActiveChat(chat);
    setViewMode('chat');
  };

  // Responsive design: show conversation list on mobile when in 'conversations' mode
  const showConversationList = viewMode === 'conversations' || window.innerWidth >= 768;

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">End-to-End Chat App</h1>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm hidden sm:inline">
                Logged in as <span className="font-semibold">{user.username}</span>
              </span>
              <Button 
                variant="danger" 
                size="small"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container mx-auto p-4 flex flex-col">
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Mobile tabs */}
          <div className="md:hidden flex border-b border-slate-200 dark:border-slate-700">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium ${viewMode === 'conversations' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
              onClick={() => setViewMode('conversations')}
            >
              Conversations
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium ${viewMode === 'chat' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
              onClick={() => setViewMode('chat')}
            >
              Chat
            </button>
          </div>

          {/* Sidebar */}
          {showConversationList && (
            <div className="md:w-1/3 lg:w-1/4 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 h-[70vh] md:h-auto overflow-hidden">
              <ConversationList 
                onSelectConversation={handleSelectConversation}
                activeConversationId={activeChat?.type === ChatType.DIRECT ? activeChat.id : undefined}
              />
            </div>
          )}

          {/* Chat area */}
          {(viewMode === 'chat' || window.innerWidth >= 768) && (
            <div className="flex-1 flex flex-col h-[70vh] md:h-auto">
              {/* Chat header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center bg-white dark:bg-slate-800">
                {activeChat?.type === ChatType.DIRECT && activeChat.recipient ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white mr-3">
                      {activeChat.recipient.profilePic ? (
                        <img 
                          src={activeChat.recipient.profilePic} 
                          alt={activeChat.recipient.username} 
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        activeChat.recipient.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <h2 className="font-medium text-lg dark:text-white">{activeChat.recipient.username}</h2>
                  </div>
                ) : (
                  <h2 className="font-medium text-lg dark:text-white">
                    {activeChat?.name || 'General Chat'}
                  </h2>
                )}
              </div>

              {/* Messages area */}
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                  <Spinner size="large" />
                </div>
              ) : (
                <div 
                  className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900"
                  ref={messageListRef}
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map(message => (
                      <MessageBubble 
                        key={message.id || message._id} 
                        message={message}
                        currentUser={user}
                      />
                    ))
                  )}
                </div>
              )}
              
              {/* Message input */}
              <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                <MessageInput 
                  onSendMessage={handleSendMessage} 
                  disabled={!isAuthenticated || !activeChat} 
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatPage;