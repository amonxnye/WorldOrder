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
  User,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, addDoc, query, where, getDocs, arrayUnion, increment, writeBatch, deleteField } from "firebase/firestore";

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

export const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent successfully to:", email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
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

export const createGameInFirestore = async (gameName: string, hostId: string, hostNationName: string, hostLeaderName: string) => {
  try {
    const gamesCollection = collection(db, "games");
    const newGameRef = await addDoc(gamesCollection, {
      gameName,
      hostId,
      playerIds: [hostId],
      playerData: {
        [hostId]: {
          nationName: hostNationName,
          leaderName: hostLeaderName,
          // Initial game state for the host
          resources: { stability: 10, economy: 5, military: 3, diplomacy: 1, culture: 2 },
          naturalResources: { wood: 500, minerals: 300, food: 400, water: 600, land: 1000 },
          population: { men: 5, women: 5, children: 0, workers: 7, soldiers: 0, scientists: 0, mood: 70, monthsPassed: 0 },
          unlockedTechs: [],
          year: 1925,
          month: 1,
          currentEra: "1925–1950",
        }
      },
      status: "lobby",
      currentTurn: hostId, // Host starts
      year: 1925,
      createdAt: new Date(),
    });
    console.log("Game created successfully with ID:", newGameRef.id);
    return newGameRef.id;
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
};

export const getGamesFromFirestore = async () => {
  try {
    console.log("🔍 Fetching games from Firestore...");
    const gamesCollection = collection(db, "games");
    const q = query(gamesCollection, where("status", "==", "lobby"));
    console.log("📋 Query created for games with status='lobby'");
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 Query executed. Found ${querySnapshot.size} documents`);
    
    const games: any[] = [];
    querySnapshot.forEach((doc) => {
      console.log(`🎮 Game found: ${doc.id}`, doc.data());
      games.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Successfully retrieved ${games.length} lobby games`);
    return games;
  } catch (error) {
    console.error("❌ Error getting games:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : error,
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

export const joinGameInFirestore = async (gameId: string, userId: string, nationName: string, leaderName: string) => {
  try {
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, {
      playerIds: arrayUnion(userId),
      [`playerData.${userId}`]: {
        nationName,
        leaderName,
        // Initial game state for the joining player
        resources: { stability: 10, economy: 5, military: 3, diplomacy: 1, culture: 2 },
        naturalResources: { wood: 500, minerals: 300, food: 400, water: 600, land: 1000 },
        population: { men: 5, women: 5, children: 0, workers: 7, soldiers: 0, scientists: 0, mood: 70, monthsPassed: 0 },
        unlockedTechs: [],
        year: 1925,
        month: 1,
        currentEra: "1925–1950",
      }
    });
    console.log("User", userId, "joined game", gameId);
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
};

export const getGameDataFromFirestore = async (gameId: string) => {
  try {
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);
    if (gameSnap.exists()) {
      return gameSnap.data();
    } else {
      console.warn("No such game document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting game data:", error);
    throw error;
  }
};

export const updateDiplomaticStanceInFirestore = async (gameId: string, userId: string, targetUserId: string, stance: 'neutral' | 'alliance' | 'rivalry') => {
  try {
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, {
      [`diplomaticStances.${userId}.${targetUserId}`]: stance,
    });
    console.log(`User ${userId} set stance to ${stance} for ${targetUserId} in game ${gameId}`);
  } catch (error) {
    console.error("Error updating diplomatic stance:", error);
    throw error;
  }
};

export const sendTradeOfferToFirestore = async (gameId: string, fromUserId: string, toUserId: string, offeredResources: any, requestedResources: any) => {
  try {
    const tradeOffersCollection = collection(db, "games", gameId, "trade_offers");
    const newOfferRef = await addDoc(tradeOffersCollection, {
      fromUserId,
      toUserId,
      offeredResources,
      requestedResources,
      status: "pending",
      createdAt: new Date(),
    });
    console.log("Trade offer sent successfully:", newOfferRef.id);
    return newOfferRef.id;
  } catch (error) {
    console.error("Error sending trade offer:", error);
    throw error;
  }
};

export const respondToTradeOfferInFirestore = async (gameId: string, tradeOfferId: string, responderUserId: string, accepted: boolean) => {
  try {
    const tradeOfferRef = doc(db, "games", gameId, "trade_offers", tradeOfferId);
    await updateDoc(tradeOfferRef, {
      status: accepted ? "accepted" : "rejected",
      respondedAt: new Date(),
    });

    if (accepted) {
      const tradeOfferSnap = await getDoc(tradeOfferRef);
      const tradeOfferData = tradeOfferSnap.data();

      if (tradeOfferData) {
        const { fromUserId, toUserId, offeredResources, requestedResources } = tradeOfferData;
        const gameRef = doc(db, "games", gameId);

        // Update sender's resources
        await updateDoc(gameRef, {
          [`playerData.${fromUserId}.naturalResources`]: {
            wood: increment(-offeredResources.wood || 0) + increment(requestedResources.wood || 0),
            minerals: increment(-offeredResources.minerals || 0) + increment(requestedResources.minerals || 0),
            food: increment(-offeredResources.food || 0) + increment(requestedResources.food || 0),
            water: increment(-offeredResources.water || 0) + increment(requestedResources.water || 0),
            land: increment(-offeredResources.land || 0) + increment(requestedResources.land || 0),
          },
        });

        // Update receiver's resources
        await updateDoc(gameRef, {
          [`playerData.${toUserId}.naturalResources`]: {
            wood: increment(offeredResources.wood || 0) + increment(-requestedResources.wood || 0),
            minerals: increment(offeredResources.minerals || 0) + increment(-requestedResources.minerals || 0),
            food: increment(offeredResources.food || 0) + increment(-requestedResources.food || 0),
            water: increment(offeredResources.water || 0) + increment(-requestedResources.water || 0),
            land: increment(offeredResources.land || 0) + increment(-requestedResources.land || 0),
          },
        });
        console.log("Trade successfully executed.");
      }
    }
    console.log(`Trade offer ${tradeOfferId} ${accepted ? "accepted" : "rejected"} by ${responderUserId}`);
  } catch (error) {
    console.error("Error responding to trade offer:", error);
    throw error;
  }
};

export const declareWarInFirestore = async (gameId: string, attackerId: string, defenderId: string) => {
  try {
    const gameRef = doc(db, "games", gameId);
    const batch = writeBatch(db);

    // Set diplomatic stance to rivalry for both sides
    batch.update(gameRef, {
      [`diplomaticStances.${attackerId}.${defenderId}`]: 'rivalry',
      [`diplomaticStances.${defenderId}.${attackerId}`]: 'rivalry',
    });

    // Add to active wars (simplified for now, could be a subcollection)
    batch.update(gameRef, {
      activeWars: arrayUnion({
        attackerId,
        defenderId,
        startedAt: new Date(),
      }),
    });

    await batch.commit();
    console.log(`War declared in game ${gameId}: ${attackerId} vs ${defenderId}`);
  } catch (error) {
    console.error("Error declaring war:", error);
    throw error;
  }
};

export const launchAttackInFirestore = async (gameId: string, attackerId: string, defenderId: string, attackStrength: number) => {
  try {
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);
    const gameData = gameSnap.data();

    if (!gameData || !gameData.playerData || !gameData.playerData[attackerId] || !gameData.playerData[defenderId]) {
      throw new Error("Game or player data not found.");
    }

    const attackerData = gameData.playerData[attackerId];
    const defenderData = gameData.playerData[defenderId];

    // Simple battle simulation: attacker military vs defender military
    const attackerMilitary = attackerData.resources.military;
    const defenderMilitary = defenderData.resources.military;

    let attackOutcome: 'win' | 'loss' | 'draw';
    let stolenResources: any = {};
    let attackerCasualties = 0;
    let defenderCasualties = 0;

    if (attackStrength > defenderMilitary * 1.2) { // Attacker significantly stronger
      attackOutcome = 'win';
      // Steal resources (e.g., 10% of defender's natural resources)
      stolenResources = {
        wood: Math.floor(defenderData.naturalResources.wood * 0.1),
        minerals: Math.floor(defenderData.naturalResources.minerals * 0.1),
        food: Math.floor(defenderData.naturalResources.food * 0.1),
        water: Math.floor(defenderData.naturalResources.water * 0.1),
        land: 0, // Land is not stolen in this simplified model
      };
      defenderCasualties = Math.floor(defenderData.population.soldiers * 0.1);
      attackerCasualties = Math.floor(attackerData.population.soldiers * 0.02);
    } else if (attackStrength < defenderMilitary * 0.8) { // Defender significantly stronger
      attackOutcome = 'loss';
      attackerCasualties = Math.floor(attackerData.population.soldiers * 0.1);
      defenderCasualties = Math.floor(defenderData.population.soldiers * 0.02);
    } else { // Close battle
      attackOutcome = 'draw';
      attackerCasualties = Math.floor(attackerData.population.soldiers * 0.05);
      defenderCasualties = Math.floor(defenderData.population.soldiers * 0.05);
    }

    const batch = writeBatch(db);

    // Update attacker's resources and population
    batch.update(gameRef, {
      [`playerData.${attackerId}.naturalResources.wood`]: increment(stolenResources.wood || 0),
      [`playerData.${attackerId}.naturalResources.minerals`]: increment(stolenResources.minerals || 0),
      [`playerData.${attackerId}.naturalResources.food`]: increment(stolenResources.food || 0),
      [`playerData.${attackerId}.naturalResources.water`]: increment(stolenResources.water || 0),
      [`playerData.${attackerId}.population.soldiers`]: increment(-attackerCasualties),
      [`playerData.${attackerId}.resources.stability`]: increment(attackOutcome === 'win' ? 5 : attackOutcome === 'loss' ? -5 : 0),
    });

    // Update defender's resources and population
    batch.update(gameRef, {
      [`playerData.${defenderId}.naturalResources.wood`]: increment(-(stolenResources.wood || 0)),
      [`playerData.${defenderId}.naturalResources.minerals`]: increment(-(stolenResources.minerals || 0)),
      [`playerData.${defenderId}.naturalResources.food`]: increment(-(stolenResources.food || 0)),
      [`playerData.${defenderId}.naturalResources.water`]: increment(-(stolenResources.water || 0)),
      [`playerData.${defenderId}.population.soldiers`]: increment(-defenderCasualties),
      [`playerData.${defenderId}.resources.stability`]: increment(attackOutcome === 'win' ? -5 : attackOutcome === 'loss' ? 5 : 0),
    });

    // Log the attack outcome (could be a subcollection of war events)
    const warEventsCollection = collection(db, "games", gameId, "war_events");
    batch.set(doc(warEventsCollection), {
      attackerId,
      defenderId,
      attackStrength,
      outcome: attackOutcome,
      stolenResources,
      attackerCasualties,
      defenderCasualties,
      timestamp: new Date(),
    });

    await batch.commit();
    console.log(`Attack launched in game ${gameId}: ${attackerId} attacked ${defenderId}. Outcome: ${attackOutcome}`);
    return { outcome: attackOutcome, stolenResources, attackerCasualties, defenderCasualties };
  } catch (error) {
    console.error("Error launching attack:", error);
    throw error;
  }
};

export { auth, db };
export default app; 