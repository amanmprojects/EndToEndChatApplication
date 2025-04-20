import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/ToastContext';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, error, isLoading } = useAuthStore();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!username || !email || !password) {
      setErrorMessage('Please fill out all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await register({ username, email, password });
      if (success) {
        showToast('Account created successfully! Please login.', 'success');
        navigate('/login');
      } else {
        // Generic error handled by the store
        setErrorMessage(error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      // This catches network errors that might not be handled by the store
      console.error('Signup error:', err);
      setErrorMessage('Cannot connect to the server. Please try again later.');
      showToast('Server connection failed. Is the backend server running?', 'error', 10000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if form should be disabled
  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Create an Account</h1>
        
        {(error || errorMessage) && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {errorMessage || error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            fullWidth
            disabled={isFormDisabled}
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            fullWidth
            disabled={isFormDisabled}
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            fullWidth
            disabled={isFormDisabled}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            fullWidth
            disabled={isFormDisabled}
            required
            error={
              confirmPassword && password !== confirmPassword
                ? 'Passwords do not match'
                : undefined
            }
          />
          
          <Button
            type="submit"
            fullWidth
            isLoading={isFormDisabled}
          >
            Sign Up
          </Button>
        </form>
        
        <p className="mt-4 text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>

        {/* Server connection status info */}
        {isSubmitting && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Connecting to server...
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupPage;