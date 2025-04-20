import React, { useState, useEffect } from 'react';
import { API_URL } from '../../services/api';

type ServerStatus = {
  isOnline: boolean;
  authIssue: boolean;
  message: string;
};

const ServerStatusIndicator: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [checkedPort, setCheckedPort] = useState<string>(API_URL);

  // Check server status periodically
  useEffect(() => {
    // Function to check if server is responding
    const checkServerStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        // First check general health endpoint
        const response = await fetch(`${API_URL}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        }).catch(() => null);
        
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          // Server is online, check auth status only if we have a token
          const token = localStorage.getItem('token');
          if (token) {
            try {
              // Try a quick request to a protected endpoint with the token
              const authController = new AbortController();
              const authTimeoutId = setTimeout(() => authController.abort(), 2000);
              
              const authResponse = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                },
                signal: authController.signal,
              });
              
              clearTimeout(authTimeoutId);
              
              if (authResponse.status === 401) {
                // Server is online but auth has failed
                setServerStatus({
                  isOnline: true,
                  authIssue: true,
                  message: 'Authentication expired. Please log in again.'
                });
              } else {
                // Everything is fine
                setServerStatus({
                  isOnline: true,
                  authIssue: false,
                  message: ''
                });
              }
            } catch (authError) {
              // Error checking auth but server is still online
              setServerStatus({
                isOnline: true,
                authIssue: false,
                message: ''
              });
            }
          } else {
            // No token but server is online
            setServerStatus({
              isOnline: true, 
              authIssue: false,
              message: ''
            });
          }
        } else {
          // Server is offline
          setServerStatus({
            isOnline: false,
            authIssue: false,
            message: 'Backend server not responding'
          });
        }
        
        setCheckedPort(API_URL);
      } catch (error) {
        setServerStatus({
          isOnline: false,
          authIssue: false,
          message: 'Connection error'
        });
        setCheckedPort(API_URL);
      }
    };

    // Check immediately and then every 10 seconds
    checkServerStatus();
    const intervalId = setInterval(checkServerStatus, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // If we haven't checked yet, don't show anything
  if (serverStatus === null) {
    return null;
  }

  // Only show indicator if there's a problem
  if (serverStatus.isOnline && !serverStatus.authIssue) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`rounded-lg p-3 shadow-md border max-w-xs 
        ${serverStatus.authIssue ? 'bg-yellow-100 border-yellow-300' : 'bg-red-100 border-red-300'}`}>
        <div className="flex items-center">
          <div className="mr-3">
            <div className={`h-3 w-3 rounded-full ${serverStatus.authIssue ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          </div>
          <div>
            <h3 className={`font-semibold ${serverStatus.authIssue ? 'text-yellow-800' : 'text-red-800'}`}>
              {serverStatus.authIssue ? 'Authentication Issue' : 'Server offline'}
            </h3>
            <p className={`text-sm mt-1 ${serverStatus.authIssue ? 'text-yellow-700' : 'text-red-700'}`}>
              {serverStatus.authIssue 
                ? 'Your session has expired. Please log in again.' 
                : `${serverStatus.message} at ${checkedPort.replace('/api', '')}. Features requiring server connection won't work.`}
            </p>
            {serverStatus.authIssue ? (
              <div className="mt-2">
                <a 
                  href="/login" 
                  className="text-xs underline text-blue-700"
                >
                  Go to login
                </a>
              </div>
            ) : (
              <div className="mt-2">
                <a 
                  href="https://github.com/yourusername/EndToEndChatApplication#troubleshooting" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs underline text-blue-700"
                >
                  View troubleshooting guide
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerStatusIndicator;