import React, { useEffect } from 'react';
import { Conversation, ChatType, ActiveChat, User } from '../../types/chat';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import Spinner from '../ui/Spinner';
import { formatDistanceToNow } from 'date-fns';
import UserSearch from './UserSearch';

interface ConversationListProps {
  onSelectConversation: (activeChat: ActiveChat) => void;
  activeConversationId?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  activeConversationId
}) => {
  const { user } = useAuthStore();
  const { 
    conversations, 
    fetchConversations, 
    startConversation, 
    isLoading 
  } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectConversation = (conversation: Conversation) => {
    if (!user) return;
    
    // Find the other participant (not the current user)
    const otherParticipant = conversation.participants.find(
      p => p._id !== user._id
    ) as User;

    onSelectConversation({
      id: conversation._id,
      type: ChatType.DIRECT,
      recipient: otherParticipant
    });
  };

  const handleSelectUser = (selectedUser: User) => {
    if (selectedUser && selectedUser._id) {
      startConversation(selectedUser._id);
    }
  };

  if (isLoading && conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Messages</h2>
        <UserSearch onSelectUser={handleSelectUser} />
      </div>

      <div className="flex-grow overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Search for users to start chatting</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {conversations.map((conversation) => {
              if (!user) return null;
              
              const otherParticipant = conversation.participants.find(
                p => p._id !== user._id
              );
              
              if (!otherParticipant) return null;

              const isActive = activeConversationId === conversation._id;
              const hasUnread = conversation.lastMessage && 
                               !conversation.lastMessage.read &&
                               conversation.lastMessage.sender !== user._id;

              return (
                <li 
                  key={conversation._id} 
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    isActive ? 'bg-slate-200 dark:bg-slate-700' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                        {otherParticipant.profilePic ? (
                          <img 
                            src={otherParticipant.profilePic} 
                            alt={otherParticipant.username} 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          otherParticipant.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">
                          {otherParticipant.username}
                        </h3>
                        {conversation.lastMessage && conversation.lastMessage.createdAt && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className={`text-sm truncate ${
                          hasUnread 
                            ? 'font-semibold text-slate-800 dark:text-slate-200' 
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {typeof conversation.lastMessage.sender === 'object' && conversation.lastMessage.sender._id === user._id ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationList;