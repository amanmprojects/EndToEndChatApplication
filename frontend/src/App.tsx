import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import useAuthStore from './store/authStore';
import { ToastProvider } from './components/ui/ToastContext';
import ServerStatusIndicator from './components/ui/ServerStatusIndicator';

function App() {
  const { checkAuthStatus } = useAuthStore();

  // Check auth status on app load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<ChatPage />} />
          </Route>
          
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/chat" replace />} />
          
          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        
        {/* Server status indicator - appears when backend is unreachable */}
        <ServerStatusIndicator />
      </Router>
    </ToastProvider>
  );
}

export default App;