import React, { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  isVisible
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Auto-hide the toast after duration
  useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 300); // Match transition duration
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Match transition duration
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div className={`
      fixed bottom-4 right-4 z-50
      ${isClosing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      transition-all duration-300 ease-in-out
    `}>
      <div className={`
        px-4 py-3 rounded-lg shadow-lg border
        flex items-center justify-between
        max-w-md
        ${typeStyles[type]}
      `}>
        <div className="flex-1 mr-2">{message}</div>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="sr-only">Close</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;