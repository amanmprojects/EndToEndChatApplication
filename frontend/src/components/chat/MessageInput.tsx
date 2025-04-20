import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

const MessageInput = ({ onSendMessage, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || disabled) return;
    
    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
        placeholder="Type a message..."
        className="flex-1 rounded-full bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
        disabled={disabled || isSending}
      />
      <Button 
        onClick={handleSend}
        disabled={!message.trim() || disabled || isSending}
        isLoading={isSending}
        className="rounded-full px-5 bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        Send
      </Button>
    </div>
  );
};

export default MessageInput;