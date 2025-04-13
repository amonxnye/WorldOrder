import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

interface AuthContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthContainer = ({ isOpen, onClose }: AuthContainerProps) => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-300 hover:text-white focus:outline-none z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        {isLogin ? (
          <Login onToggleForm={toggleForm} />
        ) : (
          <Signup onToggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
};

export default AuthContainer; 