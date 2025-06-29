import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { logOut, db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface GameStats {
  lastPlayed: any;
  gamesCompleted: number;
  highestScore: number;
}

interface UserData {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  gameStats: GameStats;
}

const UserProfile = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        setEmailError("No authenticated user");
        return;
      }

      // Strict email validation
      if (!currentUser.email) {
        setEmailError("User email not available from authentication provider");
        setLoading(false);
        console.error("CRITICAL: User authenticated but no email available", {
          uid: currentUser.uid,
          providerData: currentUser.providerData,
          emailVerified: currentUser.emailVerified
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(currentUser.email)) {
        setEmailError(`Invalid email format: ${currentUser.email}`);
        setLoading(false);
        console.error("CRITICAL: Invalid email format detected", currentUser.email);
        return;
      }

      try {
        console.log("Fetching user data for email:", currentUser.email);
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userDataFromDB = userSnap.data();
          
          // Double-check email consistency
          const dbEmail = userDataFromDB.email;
          if (dbEmail && dbEmail !== currentUser.email) {
            console.warn("Email mismatch between auth and database", {
              authEmail: currentUser.email,
              dbEmail: dbEmail
            });
          }

          setUserData({
            displayName: currentUser.displayName || userDataFromDB.displayName || 'Player',
            email: currentUser.email, // Always use auth email as source of truth
            photoURL: currentUser.photoURL || userDataFromDB.photoURL,
            gameStats: userDataFromDB.gameStats || {
              lastPlayed: new Date(),
              gamesCompleted: 0,
              highestScore: 0
            }
          });
        } else {
          console.log("No user document found, using auth data only");
          setUserData({
            displayName: currentUser.displayName || 'Player',
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            gameStats: {
              lastPlayed: new Date(),
              gamesCompleted: 0,
              highestScore: 0
            }
          });
        }
        
        setEmailError(null); // Clear any previous errors
        console.log("Successfully loaded user data with email:", currentUser.email);
        
      } catch (error) {
        console.error("Error fetching user data:", error);
        setEmailError(`Failed to load user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logOut();
      setMenuOpen(false);
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const copyEmailToClipboard = async () => {
    if (!userData?.email) {
      console.error('CRITICAL: Attempted to copy email but no email available');
      alert('Error: No email available to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(userData.email);
      console.log('✅ Email copied to clipboard:', userData.email);
      // Show success feedback
      const button = document.querySelector('[title="Copy email"]');
      if (button) {
        const originalTitle = button.getAttribute('title');
        button.setAttribute('title', '✅ Copied!');
        setTimeout(() => {
          button.setAttribute('title', originalTitle || 'Copy email');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy email:', error);
      alert(`Failed to copy email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Never';
    
    try {
      if (date.seconds) {
        // Firestore timestamp
        return new Date(date.seconds * 1000).toLocaleDateString();
      } else if (date instanceof Date) {
        // Regular Date object
        return date.toLocaleDateString();
      } else {
        return 'Invalid date';
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 rounded-full bg-gray-600 animate-pulse"></div>
        <div className="hidden md:block">
          <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Critical failure: No user or email error
  if (!currentUser || emailError) {
    return (
      <div className="relative">
        <button 
          className="flex items-center space-x-2 focus:outline-none bg-red-600 px-3 py-2 rounded" 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center">
            <span className="text-white text-sm">!</span>
          </div>
          <span className="font-medium text-white text-sm">
            Email Error
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-red-900 rounded-md shadow-lg z-10 border border-red-700">
            <div className="p-4">
              <h3 className="font-semibold text-white mb-2">Authentication Error</h3>
              <p className="text-red-200 text-sm mb-3">
                {emailError || "Unable to retrieve user email"}
              </p>
              <div className="text-xs text-red-300 bg-red-800 p-2 rounded mb-3">
                <strong>Debug Info:</strong><br/>
                User ID: {currentUser?.uid || 'None'}<br/>
                Email: {currentUser?.email || 'None'}<br/>
                Provider: {currentUser?.providerData?.[0]?.providerId || 'Unknown'}
              </div>
              <button 
                onClick={() => {
                  console.log("Full user object:", currentUser);
                  window.location.reload();
                }}
                className="w-full bg-red-700 hover:bg-red-600 text-white py-2 px-4 rounded text-sm"
              >
                Reload & Retry
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Final validation: Ensure we have actual email to display
  if (!userData?.email) {
    console.error("CRITICAL: UserData loaded but no email available", userData);
    setEmailError("User data loaded but email is missing");
    return null; // This will trigger the error state above
  }

  // Display name with priority: displayName > email (for button)
  const displayText = userData.displayName || userData.email;
  // Get the first character for the avatar
  const avatarText = displayText.charAt(0).toUpperCase();
  
  // Truncate email for display if it's too long
  const truncateEmail = (email: string) => {
    if (email.length > 20) {
      return email.substring(0, 17) + '...';
    }
    return email;
  };

  // Log successful email load for debugging
  console.log("✅ Email successfully loaded:", userData.email);

  return (
    <div className="relative">
      <button 
        className="flex items-center space-x-2 focus:outline-none" 
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
          {userData?.photoURL ? (
            <img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-white">
              {avatarText}
            </span>
          )}
        </div>
        <div className="hidden md:block text-white">
          <div className="font-medium">
            {userData.displayName || 'Player'}
          </div>
          <div className="text-xs text-blue-300 font-mono">
            {truncateEmail(userData.email)}
          </div>
        </div>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-md shadow-lg z-10 border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {avatarText}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">
                  {userData.displayName || 'Player'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <p className="text-blue-300 text-sm font-mono font-medium break-all">
                      {userData.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Authenticated Email ✓
                    </p>
                  </div>
                  <button
                    onClick={copyEmailToClipboard}
                    className="text-gray-400 hover:text-white transition-colors p-1 flex-shrink-0"
                    title="Copy email"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Signed in</span>
            </div>
          </div>
          
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white mb-2">Account Information</h3>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-700 p-2 rounded">
                <p className="text-gray-300 text-xs">Email Address:</p>
                <p className="text-white font-mono text-sm">{userData.email}</p>
              </div>
              <div className="bg-gray-700 p-2 rounded">
                <p className="text-gray-300 text-xs">Authentication Provider:</p>
                <p className="text-white text-sm">
                  {currentUser.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email/Password'}
                </p>
              </div>
              <div className="bg-gray-700 p-2 rounded">
                <p className="text-gray-300 text-xs">Email Verified:</p>
                <p className={`text-sm ${currentUser.emailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {currentUser.emailVerified ? '✅ Verified' : '⚠️ Unverified'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white mb-2">Game Stats</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p>Last played: {formatDate(userData.gameStats.lastPlayed)}</p>
              <p>Games completed: {userData.gameStats.gamesCompleted || 0}</p>
              <p>Highest score: {userData.gameStats.highestScore || 0}</p>
            </div>
          </div>
          
          <div className="p-2">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 rounded"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 