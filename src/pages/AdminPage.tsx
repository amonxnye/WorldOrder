import React, { useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { userTracker } from '../utils/userTracking';
import AuthContainer from '../components/auth/AuthContainer';
import AdminDashboard from '../components/AdminDashboard';

const AdminPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  // Check if user is admin
  const isAdmin = currentUser?.email === 'amonxnye@gmail.com';

  useEffect(() => {
    if (currentUser) {
      userTracker.startTracking(currentUser);
      userTracker.trackPageView('admin_page');
    }

    return () => {
      userTracker.stopTracking();
    };
  }, [currentUser]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Admin Access Required</h1>
            <p className="text-gray-600 mb-6">Please sign in with an administrator account to access this page.</p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
        <AuthContainer isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  // Not authorized (wrong email)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-2">You are not authorized to access the admin dashboard.</p>
            <p className="text-sm text-gray-500 mb-6">
              Current user: {currentUser.email}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Return to Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized admin user
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard />
    </div>
  );
};

export default AdminPage;