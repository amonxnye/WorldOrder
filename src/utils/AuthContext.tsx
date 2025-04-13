import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, createUserProfile } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  loading: true,
  error: null
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(
      auth, 
      async (user) => {
        try {
          if (user) {
            console.log("User authenticated:", user.uid);
            await createUserProfile(user);
            setCurrentUser(user);
          } else {
            console.log("No user authenticated");
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Error in auth state change:", err);
          setError("Authentication error occurred");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Auth state change error:", error);
        setError("Authentication observer failed");
        setLoading(false);
      }
    );

    // Clean up the subscription
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-xl">Loading authentication...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext; 