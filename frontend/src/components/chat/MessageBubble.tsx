import { Message, User as ChatUser } from '../../types/chat';
import { User } from '../../types/auth';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  currentUser: User | null;
}

const MessageBubble = ({ message, currentUser }: MessageBubbleProps) => {
  // Check if the message is from the current user
  const isCurrentUser = 
    message.sender === 'me' || 
    message.userId === currentUser?._id ||
    (typeof message.sender === 'object' && message.sender._id === currentUser?._id);

  // Get sender information for display
  const getSenderName = () => {
    if (isCurrentUser) return 'You';
    if (typeof message.sender === 'object') return message.sender.username;
    return 'Unknown User';
  };

  // Get sender avatar
  const getSenderAvatar = () => {
    if (typeof message.sender === 'object' && message.sender.profilePic) {
      return message.sender.profilePic;
    }
    return null;
  };

  // Format timestamp if available
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    
    // For recent messages (less than a day), show time
    if (new Date(timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // For older messages, show relative time
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Show sender name only for messages from others in a group chat
  const showSenderName = !isCurrentUser && message.roomId;

  return (
    <div 
      className={`flex ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Avatar for non-current users */}
      {!isCurrentUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center mr-2 mt-1 shadow-sm">
          {getSenderAvatar() ? (
            <img 
              src={getSenderAvatar() || ''} 
              alt={getSenderName()} 
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-white">
              {getSenderName().charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      <div 
        className={`flex flex-col max-w-[85%] ${
          isCurrentUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender name for group chats */}
        {showSenderName && (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 ml-1">
            {getSenderName()}
          </span>
        )}

        <div className={`rounded-2xl py-2 px-4 shadow-sm ${
          isCurrentUser
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-600'
        }`}>
          {message.text || message.content}
        </div>
        
        <div className="flex items-center mt-1 space-x-1 px-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatTime(message.createdAt)}
          </span>
          
          {/* Read status for direct messages */}
          {message.conversationId && isCurrentUser && (
            <span className="text-xs">
              {message.read ? (
                <svg className="h-3 w-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 12.586l7.293-7.293a1 1 0 011.414 1.414l-8 8z"/>
                </svg>
              ) : (
                <svg className="h-3 w-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 12.586l7.293-7.293a1 1 0 011.414 1.414l-8 8z"/>
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;