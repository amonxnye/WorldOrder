import { 
  collection, 
  doc, 
  setDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// This function creates sample users if the database is empty
// Only for testing/demonstration purposes
export const seedSampleUserData = async () => {
  try {
    const sampleUsers = [
      {
        uid: 'demo_user_1',
        email: 'player1@example.com',
        displayName: 'Player One',
        nationName: 'Great Empire',
        leaderName: 'Emperor Augustus',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
        lastLoginAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
        totalPlayTime: 340, // 5h 40m
        sessionCount: 8,
        status: 'active',
        gameStats: {
          year: 1965,
          totalPopulation: 150,
          economyScore: 78,
          technologiesUnlocked: 12,
          disastersSurvived: 3,
          highestEconomyResource: 85
        }
      },
      {
        uid: 'demo_user_2',
        email: 'player2@example.com',
        displayName: 'Player Two',
        nationName: 'Tech Republic',
        leaderName: 'Prime Minister Tesla',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)), // 14 days ago
        lastLoginAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
        totalPlayTime: 520, // 8h 40m
        sessionCount: 15,
        status: 'active',
        gameStats: {
          year: 1980,
          totalPopulation: 200,
          economyScore: 92,
          technologiesUnlocked: 18,
          disastersSurvived: 5,
          highestEconomyResource: 95
        }
      },
      {
        uid: 'demo_user_3',
        email: 'player3@example.com',
        displayName: 'Player Three',
        nationName: 'Democracy United',
        leaderName: 'President Liberty',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30 days ago
        lastLoginAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
        totalPlayTime: 120, // 2h
        sessionCount: 3,
        status: 'active',
        gameStats: {
          year: 1945,
          totalPopulation: 80,
          economyScore: 45,
          technologiesUnlocked: 6,
          disastersSurvived: 1,
          highestEconomyResource: 55
        }
      },
      {
        uid: 'demo_user_4',
        email: 'suspended@example.com',
        displayName: 'Suspended User',
        nationName: 'Banned Nation',
        leaderName: 'Dictator Bad',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
        lastLoginAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
        totalPlayTime: 60, // 1h
        sessionCount: 2,
        status: 'suspended',
        suspendedUntil: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
        suspensionReason: 'Inappropriate behavior',
        gameStats: {
          year: 1930,
          totalPopulation: 25,
          economyScore: 15,
          technologiesUnlocked: 2,
          disastersSurvived: 0,
          highestEconomyResource: 20
        }
      }
    ];

    console.log('Seeding sample user data...');
    
    for (const user of sampleUsers) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, user);
      console.log(`Created sample user: ${user.displayName}`);
    }

    // Also create some sample user actions
    const sampleActions = [
      {
        userId: 'demo_user_1',
        actionType: 'game_started',
        timestamp: Timestamp.now(),
        details: { nationName: 'Great Empire' }
      },
      {
        userId: 'demo_user_1',
        actionType: 'tech_research',
        timestamp: Timestamp.now(),
        details: { techId: 'industrial_revolution' }
      },
      {
        userId: 'demo_user_2',
        actionType: 'resource_investment',
        timestamp: Timestamp.now(),
        details: { resource: 'economy' }
      }
    ];

    for (const action of sampleActions) {
      const actionRef = doc(db, 'user_actions', `${action.userId}_${Date.now()}_${Math.random()}`);
      await setDoc(actionRef, action);
    }

    console.log('Sample data seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return false;
  }
};