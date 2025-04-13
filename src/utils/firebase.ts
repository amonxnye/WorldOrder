import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgfOaE1QuoEpzZWKEYQbo_7uPwPdHw3uY",
  authDomain: "worldordergameapp.firebaseapp.com",
  projectId: "worldordergameapp",
  storageBucket: "worldordergameapp.firebasestorage.app",
  messagingSenderId: "382725769710",
  appId: "1:382725769710:web:2d16f2921639e63b33e6ff",
  measurementId: "G-T3D3ERV3V5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.error("Analytics failed to initialize:", error);
  // Analytics is optional and may not work in some environments
}

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in successfully:", result.user.uid);
    return result;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User created successfully:", result.user.uid);
    await createUserProfile(result.user);
    return result;
  } catch (error) {
    console.error("Error signing up with email:", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("User signed in with Google successfully:", result.user.uid);
    await createUserProfile(result.user);
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const createUserProfile = async (user: User, additionalData = {}) => {
  if (!user) return null;

  try {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const { email, displayName, photoURL } = user;
      const createdAt = new Date();

      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt,
        gameStats: {
          lastPlayed: createdAt,
          gamesCompleted: 0,
          highestScore: 0
        },
        ...additionalData
      });
      console.log("User profile created successfully for:", user.uid);
    } else {
      console.log("User profile already exists for:", user.uid);
    }

    return userRef;
  } catch (error) {
    console.error("Error creating user profile:", error);
    return null;
  }
};

export const updateUserGameStats = async (userId: string, gameStats: any) => {
  if (!userId) {
    console.error("Invalid user ID provided");
    return;
  }
  
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { gameStats });
    console.log("Game stats updated successfully for user:", userId);
  } catch (error) {
    console.error("Error updating user game stats:", error);
  }
};

export { auth, db };
export default app; 