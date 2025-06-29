import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../utils/AuthContext';
import { getGameDataFromFirestore, db } from '../utils/firebase';
import { updateDoc, doc, onSnapshot } from 'firebase/firestore';

export const useMultiplayerSync = () => {
  const { currentUser } = useAuth();
  const { 
    gameId, 
    multiplayer, 
    syncGameState, 
    setSyncStatus, 
    updatePlayerStatus,
    addGameEvent,
    initializeMultiplayer 
  } = useGameStore();
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize multiplayer session
  const initializeSession = useCallback(async (gameId: string) => {
    if (!currentUser) return;

    try {
      setSyncStatus('syncing');
      
      const gameData = await getGameDataFromFirestore(gameId);
      if (!gameData) {
        setSyncStatus('error');
        return;
      }

      // Determine if current user is host
      const isHost = gameData.hostId === currentUser.uid;
      
      // Transform player data for the store
      const players = Object.entries(gameData.playerData || {}).reduce((acc, [userId, data]: [string, any]) => {
        acc[userId] = {
          userId,
          nationName: data.nationName,
          leaderName: data.leaderName,
          isOnline: true, // Will be updated by presence system
          lastSeen: Date.now()
        };
        return acc;
      }, {} as Record<string, any>);

      // Initialize multiplayer state in store
      initializeMultiplayer(gameId, isHost, players);
      
      // Sync the current user's game state
      const playerState = gameData.playerData[currentUser.uid];
      if (playerState) {
        syncGameState(playerState);
      }

      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to initialize multiplayer session:', error);
      setSyncStatus('error');
    }
  }, [currentUser, setSyncStatus, initializeMultiplayer, syncGameState]);

  // Real-time listener for game updates
  const setupRealtimeListener = useCallback(() => {
    if (!gameId) return;

    const gameRef = doc(db, 'games', gameId);
    
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (!snapshot.exists()) return;
      
      const gameData = snapshot.data();
      
      // Update player statuses
      if (gameData.playerData) {
        Object.keys(gameData.playerData).forEach(userId => {
          if (userId !== currentUser?.uid) {
            updatePlayerStatus(userId, true); // Simplified - would need actual presence detection
          }
        });
      }

      // Sync diplomatic changes
      if (gameData.diplomaticStances) {
        syncGameState({ diplomaticStances: gameData.diplomaticStances });
      }

      // Sync war updates
      if (gameData.activeWars) {
        syncGameState({ activeWars: gameData.activeWars });
      }

      // Handle new trade offers as events
      if (gameData.trade_offers) {
        Object.values(gameData.trade_offers).forEach((offer: any) => {
          if (offer.toUserId === currentUser?.uid && offer.status === 'pending') {
            addGameEvent({
              type: 'trade_offer',
              fromUserId: offer.fromUserId,
              targetUserId: offer.toUserId,
              data: {
                offerId: offer.id,
                offeredResources: offer.offeredResources,
                requestedResources: offer.requestedResources
              }
            });
          }
        });
      }
    });

    unsubscribeRef.current = unsubscribe;
  }, [gameId, currentUser, updatePlayerStatus, syncGameState, addGameEvent]);

  // Periodic sync for player's own state
  const setupPeriodicSync = useCallback(async () => {
    if (!gameId || !currentUser || !multiplayer.isMultiplayer) return;

    const syncPlayerState = async () => {
      try {
        setSyncStatus('syncing');
        
        const gameStore = useGameStore.getState();
        const playerData = {
          resources: gameStore.resources,
          naturalResources: gameStore.naturalResources,
          population: gameStore.population,
          unlockedTechs: gameStore.unlockedTechs,
          year: gameStore.year,
          month: gameStore.month,
          currentEra: gameStore.currentEra,
          yearlyObjectives: gameStore.yearlyObjectives,
          canAdvanceYear: gameStore.canAdvanceYear,
          lastUpdated: Date.now()
        };

        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, {
          [`playerData.${currentUser.uid}`]: playerData
        });

        setSyncStatus('synced');
      } catch (error) {
        console.error('Failed to sync player state:', error);
        setSyncStatus('error');
      }
    };

    // Initial sync
    await syncPlayerState();

    // Set up periodic sync (every 30 seconds)
    syncIntervalRef.current = setInterval(syncPlayerState, 30000);
  }, [gameId, currentUser, multiplayer.isMultiplayer, setSyncStatus]);

  // Update player presence
  const updatePresence = useCallback(async () => {
    if (!gameId || !currentUser) return;

    try {
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, {
        [`playerPresence.${currentUser.uid}`]: {
          isOnline: true,
          lastSeen: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, [gameId, currentUser]);

  // Handle multiplayer actions with queuing
  const executeMultiplayerAction = useCallback(async (actionType: string, actionData: any) => {
    if (!multiplayer.isMultiplayer) {
      // Single player mode - execute immediately
      return actionData.execute();
    }

    try {
      setSyncStatus('syncing');
      
      // Execute the action locally first
      const result = actionData.execute();
      
      // Log the action in Firebase for other players
      if (gameId && currentUser) {
        const actionLog = {
          playerId: currentUser.uid,
          type: actionType,
          data: actionData.payload,
          timestamp: Date.now()
        };

        // Add to game's action log
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, {
          [`actionLog.${actionLog.timestamp}`]: actionLog
        });

        // Add event for other players
        addGameEvent({
          type: actionType as any,
          fromUserId: currentUser.uid,
          data: actionData.payload
        });
      }
      
      setSyncStatus('synced');
      return result;
    } catch (error) {
      console.error('Failed to execute multiplayer action:', error);
      setSyncStatus('error');
      throw error;
    }
  }, [multiplayer.isMultiplayer, gameId, currentUser, setSyncStatus, addGameEvent]);

  // Setup and cleanup effects
  useEffect(() => {
    if (gameId && multiplayer.isMultiplayer) {
      initializeSession(gameId);
      setupRealtimeListener();
      setupPeriodicSync();
      updatePresence();

      // Update presence every 60 seconds
      const presenceInterval = setInterval(updatePresence, 60000);

      return () => {
        clearInterval(presenceInterval);
      };
    }
  }, [gameId, multiplayer.isMultiplayer, initializeSession, setupRealtimeListener, setupPeriodicSync, updatePresence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    syncStatus: multiplayer.syncStatus,
    isMultiplayer: multiplayer.isMultiplayer,
    isHost: multiplayer.isHost,
    players: multiplayer.players,
    currentPlayer: multiplayer.turnInfo.currentPlayer,
    gameEvents: multiplayer.gameEvents.filter(event => !event.read),
    executeMultiplayerAction
  };
};

export default useMultiplayerSync;