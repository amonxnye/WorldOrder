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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userDataFromDB = userSnap.data();
          setUserData({
            displayName: currentUser.displayName || userDataFromDB.displayName || 'Player',
            email: currentUser.email,
            photoURL: currentUser.photoURL || userDataFromDB.photoURL,
            gameStats: userDataFromDB.gameStats || {
              lastPlayed: new Date(),
              gamesCompleted: 0,
              highestScore: 0
            }
          });
        } else {
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
      } catch (error) {
        console.error("Error fetching user data:", error);
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

  if (!currentUser || loading) {
    return null;
  }

  // Display name with priority: email > displayName
  const displayText = userData?.email || userData?.displayName || 'User';
  // Get the first character for the avatar
  const avatarText = displayText.charAt(0).toUpperCase();

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
        <span className="font-medium hidden md:block text-white">
          {userData?.email || 'User'}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg z-10 border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <p className="font-semibold text-white">{userData?.email}</p>
            {userData?.displayName && userData.displayName !== userData.email && (
              <p className="text-sm text-gray-300">{userData.displayName}</p>
            )}
          </div>
          
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white mb-2">Game Stats</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p>Last played: {formatDate(userData?.gameStats.lastPlayed)}</p>
              <p>Games completed: {userData?.gameStats.gamesCompleted || 0}</p>
              <p>Highest score: {userData?.gameStats.highestScore || 0}</p>
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